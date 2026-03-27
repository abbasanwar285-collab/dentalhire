import { db } from './db';
import { aiLearning } from './aiLearning';
import { inventoryService } from './inventoryService';
import { analysisService } from './analysisService';
import { SystemReport } from '../types';

export interface ClinicHealthReport {
    efficiencies: {
        staff: string;
        inventory: string;
        finance: string;
    };
    bottlenecks: string[];
    recommendations: string[];
}

class ManagerService {
    /**
     * Generate a comprehensive report on clinic performance and workflow bottlenecks
     */
    async generateClinicHealthReport(_doctorId: string = 'dr_abbas'): Promise<ClinicHealthReport> {
        const stats = await db.getStats();
        const inventoryCandidates = await inventoryService.getRestockCandidates();

        const bottlenecks: string[] = [];
        const recommendations: string[] = [];

        // 1. Financial Health
        const totalPastIncome = stats.chartData.reduce((acc, curr) => acc + curr.income, 0);
        const daysWithIncome = stats.chartData.filter(d => d.income > 0).length || 1;
        const avgDailyIncome = totalPastIncome / daysWithIncome;

        let financeStatus = 'مستقر';
        if (stats.todayIncome > avgDailyIncome * 1.2) {
            financeStatus = 'ممتاز 🚀';
            recommendations.push('أداء مالي رائع اليوم! أعلى من المعدل المعتاد.');
        } else if (stats.todayIncome < avgDailyIncome * 0.5 && stats.todayCount > 2) {
            financeStatus = 'منخفض';
            bottlenecks.push('الدخل اليوم أقل من المتوقع رغم وجود مواعيد.');
        }

        // 2. Workload & Staff Efficiency
        let staffStatus = 'متوازن';
        if (stats.todayCount > 8) {
            staffStatus = 'ضغط عالي 🔥';
            bottlenecks.push('عدد المواعيد اليوم كبير، قد يؤثر على جودة الخدمة.');
        } else if (stats.todayCount === 0) {
            staffStatus = 'غير نشط 💤';
            recommendations.push('لا توجد مواعيد اليوم. وقت مناسب لمراجعة المخزون أو التسويق.');
        }

        // 3. Inventory
        if (inventoryCandidates.length > 3) {
            bottlenecks.push(`يوجد ${inventoryCandidates.length} مواد تحتاج لإعادة طلب عاجل.`);
        }

        // 4. Staff Monitoring Insights
        const staffInsights = await this.detectStaffHighlights();
        staffInsights.forEach(insight => {
            if (insight.impact === 'negative') {
                bottlenecks.push(insight.content);
            } else {
                recommendations.push(insight.content);
            }
        });

        // 5. randomized Tip
        const TIPS = [
            'راجع قائمة المرضى الغائبين وتواصل معهم.',
            'تأكد من تحديث أسعار المواد في المخزون.',
            'هل قمت بعمل نسخة احتياطية للبيانات هذا الأسبوع؟',
            'راجع تقارير المصروفات لتقليل التكاليف غير الضرورية.',
            'فعل نظام التذكير التلقائي لتقليل نسبة الغياب.'
        ];
        const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
        recommendations.push(`💡 نصيحة: ${randomTip}`);

        return {
            efficiencies: {
                staff: staffStatus,
                inventory: inventoryCandidates.length > 0 ? 'يحتاج متابعة' : 'ممتاز',
                finance: financeStatus
            },
            bottlenecks,
            recommendations
        };
    }

    /**
     * Detect interesting patterns in staff activity
     */
    async detectStaffHighlights(): Promise<Omit<SystemReport, 'id' | 'timestamp' | 'isRead'>[]> {
        const userIds = await aiLearning.getAllUsers();
        const highlights: Omit<SystemReport, 'id' | 'timestamp' | 'isRead'>[] = [];

        for (const userId of userIds) {
            const stats = await aiLearning.getStats(userId);
            const pattern = await aiLearning.getUserPattern(userId);

            if (!pattern) {
                continue;
            }

            const userName = userId.replace('dr_', 'د. ').replace('_', ' ');

            // Check if user is learning fast (IQ > 30)
            if (stats.learningScore > 15 && stats.learningScore < 25) {
                highlights.push({
                    type: 'staff_performance',
                    title: 'بداية التعلم',
                    content: `أيريس بدأت تفهم أسلوب عمل ${userName}. لقد قمنا بتحليل تاريخ العمل لبناء هذا النموذج.`,
                    impact: 'positive',
                    userId
                });
            } else if (stats.learningScore > 35 && stats.learningScore < 45) {
                highlights.push({
                    type: 'staff_performance',
                    title: 'تطور ملحوظ',
                    content: `أيريس تعلمت الكثير من أسلوب عمل ${userName} مؤخراً. أصبحت قادرة على توقع خطواته القادمة بدقة.`,
                    impact: 'positive',
                    userId
                });
            }

            // Check for peak hours mismatch
            const currentHour = new Date().getHours();
            const frequencies = Object.values(pattern.hourFrequencies);
            const maxFreq = Math.max(...frequencies.map(f => Number(f)));
            if (Number(pattern.hourFrequencies[currentHour] || 0) > maxFreq * 0.8 && stats.totalActions > 50) {
                highlights.push({
                    type: 'staff_performance',
                    title: 'ساعة ذروة',
                    content: `هذا هو وقت النشاط الأقصى لـ ${userName}. لاحظنا أنه ينجز معظم مهامه في هذه الساعة.`,
                    impact: 'neutral',
                    userId
                });
            }
        }

        return highlights;
    }

    /**
     * Generate and save report to the app's internal system
     */
    async triggerDailyInternalReport(): Promise<void> {
        const highlights = await this.detectStaffHighlights();

        for (const highlight of highlights) {
            await (db as any).saveReport(highlight);
        }
    }

    /**
     * Process a newly added note through the AI pipeline
     */
    async processNewNote(note: string, patientId: string): Promise<void> {
        const actions = await analysisService.analyzeNote(note, patientId);
        if (actions.length > 0) {
            // Processed
        }
    }
}

export const managerService = new ManagerService();
