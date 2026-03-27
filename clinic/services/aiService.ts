import { aiLearning } from './aiLearning';
import { db } from './db';

export interface AIInsight {
    id: string;
    title: string;
    description: string;
    type: 'alert' | 'suggest' | 'info';
    category: 'financial' | 'clinical' | 'inventory' | 'schedule';
    actionLabel?: string;
    actionPath?: string;
}

export interface QuickAction {
    id: string;
    label: string;
    icon: string; // Lucide icon name
    path: string;
    color: string;
}

class AIService {
    /**
     * Analyze current state and generate insights
     */
    async generateInsights(doctorId: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        const isQasim = doctorId === 'dr_qasim';

        // 1. Fetch data
        let patients = await db.getPatients();
        let appointments = await db.getAppointments();
        const inventory = await db.getInventory();
        const userPattern = await aiLearning.getUserPattern(doctorId);

        // 2. Personalization Filter (Dr. Qasim only sees his data)
        if (isQasim) {
            patients = patients.filter(p => p.orthoDoctorId === 'dr_qasim');
            appointments = appointments.filter(a => a.doctorId === 'dr_qasim');
        }

        // 3. Behavioral Learning Insight (Next Action Prediction)
        if (userPattern?.lastAction) {
            const predictedAction = await aiLearning.predictNextAction(doctorId, userPattern.lastAction.type);
            if (predictedAction && predictedAction !== userPattern.lastAction.type) {
                insights.push({
                    id: 'behavior_predict',
                    title: 'اقتراح ذكي (Magic)',
                    description: `لاحظت أنك عادة تقوم بـ "${this.getActionLabel(predictedAction)}" بعد "${this.getActionLabel(userPattern.lastAction.type)}". هل تريد القيام بذلك الآن؟`,
                    type: 'suggest',
                    category: 'clinical',
                    actionLabel: 'تنفيذ الإجراء',
                    actionPath: this.getActionPath(predictedAction)
                });
            }
        }

        // 4. Inventory Burn Rate Analysis (Self-Learning Manager)
        if (!isQasim) {
            // Check ALL inventory types, not just surgery
            const lowStockItems = inventory.filter(item =>
                item.quantity < (item.minStock || 5) && item.quantity > 0
            );

            for (const item of lowStockItems.slice(0, 3)) {
                insights.push({
                    id: `low_stock_${item.id}`,
                    title: 'تنبيه مخزون منخفض',
                    description: `"${item.name}" منخفض المخزون (المتبقي: ${item.quantity}). يُنصح بإعادة التزويد قبل النفاذ.`,
                    type: 'alert',
                    category: 'inventory',
                    actionLabel: 'فتح المخزون',
                    actionPath: '/inventory'
                });
            }

            // Check for expired items
            const today = new Date();
            const expiredItems = inventory.filter(item => {
                if (!item.expiryDate) {
                    return false;
                }
                const expiry = new Date(item.expiryDate);
                return expiry < today;
            });

            if (expiredItems.length > 0) {
                insights.push({
                    id: 'expired_items',
                    title: 'مواد منتهية الصلاحية!',
                    description: `يوجد ${expiredItems.length} عناصر منتهية الصلاحية في المخزون. يجب إزالتها فوراً.`,
                    type: 'alert',
                    category: 'inventory',
                    actionLabel: 'مراجعة المخزون',
                    actionPath: '/inventory'
                });
            }
        }

        // 5. Financial Insights (Skip for Dr. Qasim)
        if (!isQasim) {
            const highDebtPatients = patients
                .filter(p => (p.totalCost - (p.paidAmount || 0)) > 500000)
                .slice(0, 3);

            if (highDebtPatients.length > 0) {
                insights.push({
                    id: 'financial_debt',
                    title: 'متابعة مديونيات',
                    description: `يوجد ${highDebtPatients.length} مراجعين لديهم مديونية عالية. Iris تقترح جدولتها اليوم.`,
                    type: 'suggest',
                    category: 'financial',
                    actionLabel: 'عرض المديونين',
                    actionPath: '/?filter=debt'
                });
            }
        }

        // 6. Clinical focus (Ortho checkup)
        const orthoCount = patients.filter(p => p.orthoTotalCost && p.orthoTotalCost > 0).length;
        if (orthoCount > 0) {
            insights.push({
                id: 'ortho_stats',
                title: isQasim ? 'مرضى التقويم الخاص بك' : 'مؤشرات التقويم',
                description: isQasim
                    ? `لديك ${orthoCount} حالة تقويم تحت إشرافك حالياً.`
                    : `لديك قاعدة بيانات كبيرة لمرضى التقويم (${orthoCount} مريض). هل تريد عرض الإحصائيات؟`,
                type: 'info',
                category: 'clinical',
                actionLabel: isQasim ? 'فتح السجلات' : 'فتح التقارير',
                actionPath: isQasim ? '/' : '/reports'
            });
        }

        // 7. Active Schedule
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayApps = appointments.filter(a => a.date === todayStr);
        if (todayApps.length > 0) {
            insights.push({
                id: 'schedule_busy',
                title: 'جدول اليوم',
                description: isQasim
                    ? `لديك ${todayApps.length} مواعيد تخص مرضى التقويم اليوم.`
                    : `لديك ${todayApps.length} مواعيد اليوم. يرجى التأكد من جاهزية العيادة.`,
                type: 'info',
                category: 'schedule',
                actionLabel: 'عرض المواعيد',
                actionPath: '/calendar'
            });
        }

        // 8. Afternoon Energy / Peak Hours
        const isPeak = await aiLearning.isPeakHour(doctorId);
        if (isPeak) {
            insights.push({
                id: 'peak_hour',
                title: 'وقت النشاط العالي',
                description: 'أنت في ذروة نشاطك المعتادة. هل قمت بمراجعة مواعيد المساء المتأخرة لتجنب الازدحام؟',
                type: 'info',
                category: 'schedule',
                actionLabel: 'مراجعة المواعيد',
                actionPath: '/calendar'
            });
        }

        // 9. Patient Follow-up Reminders (NEW FEATURE)
        if (!isQasim) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const patientsNeedingFollowUp = patients.filter(p => {
                // Has incomplete procedures
                const hasIncomplete = p.procedures?.some(proc => proc.status === 'planned');
                // Last activity was over 30 days ago
                const lastActivity = p.updatedAt || p.createdAt;
                const lastActivityTime = typeof lastActivity === 'string' ? new Date(lastActivity).getTime() : lastActivity;
                return hasIncomplete && lastActivityTime < thirtyDaysAgo;
            });

            if (patientsNeedingFollowUp.length > 0) {
                insights.push({
                    id: 'follow_up_needed',
                    title: 'مرضى يحتاجون متابعة',
                    description: `${patientsNeedingFollowUp.length} مرضى لديهم خطط علاج غير مكتملة ولم يزوروا العيادة منذ أكثر من شهر.`,
                    type: 'suggest',
                    category: 'clinical',
                    actionLabel: 'عرض القائمة',
                    actionPath: '/?filter=debt'
                });
            }
        }

        // 10. Incomplete Procedures Alert (NEW FEATURE)
        const incompleteProcedures = patients.flatMap(p =>
            (p.procedures || []).filter(proc => proc.status === 'planned')
        );
        if (incompleteProcedures.length > 5) {
            insights.push({
                id: 'incomplete_procedures',
                title: 'خطط علاج معلقة',
                description: `لديك ${incompleteProcedures.length} إجراء علاجي مخطط لم يكتمل بعد. يُنصح بجدولة مواعيد لإتمامها.`,
                type: 'suggest',
                category: 'clinical',
                actionLabel: 'عرض المرضى',
                actionPath: '/'
            });
        }

        return insights;
    }

    private getActionLabel(action: string): string {
        const labels: Record<string, string> = {
            add_patient: 'إضافة مريض',
            add_appointment: 'حجز موعد',
            add_payment: 'تسجيل دفعة',
            complete_procedure: 'إكمال إجراء',
            add_ortho_visit: 'زيارة تقويم'
        };
        return labels[action] || action;
    }

    private getActionPath(action: string): string {
        const paths: Record<string, string> = {
            add_patient: '/add-patient',
            add_appointment: '/calendar',
            add_payment: '/',
            complete_procedure: '/',
            add_ortho_visit: '/'
        };
        return paths[action] || '/';
    }

    /**
     * Get dynamic quick actions for the header based on context
     */
    async getQuickActions(doctorId: string): Promise<QuickAction[]> {
        const actions: QuickAction[] = [];
        const isQasim = doctorId === 'dr_qasim';
        const hour = new Date().getHours();
        const userPattern = await aiLearning.getUserPattern(doctorId);

        // 1. Add Patient - ALWAYS SHOW (Most important action)
        actions.push({
            id: 'add_patient',
            label: 'إضافة مريض',
            icon: 'PlusCircle',
            path: '/add-patient',
            color: 'bg-violet-600'
        });

        // 2. Schedule priority
        const isPeak = await aiLearning.isPeakHour(doctorId);
        if (isPeak || hour >= 16) {
            actions.push({
                id: 'calendar',
                label: 'جدول المواعيد',
                icon: 'Calendar',
                path: '/calendar',
                color: 'bg-indigo-600'
            });
        }

        // 3. Financial/Expense priority (Skip for Qasim)
        if (!isQasim && hour < 21) {
            actions.push({
                id: 'expenses',
                label: 'صرفيات العيادة',
                icon: 'DollarSign',
                path: '/expenses',
                color: 'bg-emerald-600'
            });
        }

        // 4. Activity priority for Qasim
        if (isQasim) {
            actions.push({
                id: 'activity',
                label: 'نشاطاتي',
                icon: 'Activity',
                path: '/activity-log',
                color: 'bg-orange-600'
            });
        }

        // 5. Behavioral Prediction
        if (userPattern?.lastAction) {
            const predicted = await aiLearning.predictNextAction(doctorId, userPattern.lastAction.type);
            if (predicted === 'add_appointment' && !actions.find(a => a.id === 'calendar')) {
                actions.push({
                    id: 'book_app',
                    label: 'حجز موعد',
                    icon: 'PlusCircle',
                    path: '/calendar',
                    color: 'bg-blue-600'
                });
            }
        }

        // Ensure we always have at least 2 actions
        if (actions.length < 2) {
            if (!actions.find(a => a.id === 'add_patient')) {
                actions.push({ id: 'add_patient', label: 'إضافة مريض', icon: 'PlusCircle', path: '/add-patient', color: 'bg-violet-600' });
            }
            if (!isQasim && !actions.find(a => a.id === 'expenses')) {
                actions.push({ id: 'expenses', label: 'صرفيات العيادة', icon: 'DollarSign', path: '/expenses', color: 'bg-emerald-600' });
            } else if (isQasim && !actions.find(a => a.id === 'calendar')) {
                actions.push({ id: 'calendar', label: 'الجدول', icon: 'Calendar', path: '/calendar', color: 'bg-indigo-600' });
            }
        }

        return actions.slice(0, 3); // Max 3 actions for the top bar
    }

    /**
     * Get a greeting based on time and doctor
     */
    getGreeting(doctorName: string): string {
        const hour = new Date().getHours();
        let intro = '';
        if (hour < 5) {
            intro = 'الوقت متأخر جداً';
        } else if (hour < 12) {
            intro = 'صباح الخير';
        } else if (hour < 18) {
            intro = 'طاب يومك';
        } else {
            intro = 'مساء الخير';
        }

        return `${intro}، ${doctorName}. أنا Iris، محرك الإدارة السحري لعيادتك جاهز!`;
    }
}

export const aiService = new AIService();
