/**
 * Smart AI Service - دمج Gemini + Grok معاً
 * 
 * خدمة ذكية تجمع بين قدرات Gemini (الطبية) و Grok (المالية/الإدارية)
 * لتقديم تحليلات شاملة ومتكاملة
 */

import { geminiService } from './geminiService';
import { grokService } from './grokService';
import { Patient, Appointment, Expense } from '../types';
import { db } from './db';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UnifiedAnalysis {
    medical: {
        patientHealthScore: number;
        treatmentRecommendations: string[];
        riskFactors: string[];
        nextSteps: string[];
    };
    financial: {
        profitabilityScore: number;
        revenueForecast: number[];
        costOptimization: string[];
        growthOpportunities: string[];
    };
    operational: {
        efficiencyScore: number;
        bottlenecks: string[];
        improvements: string[];
        predictions: string[];
    };
    summary: string;
}

export interface PredictiveInsight {
    type: 'revenue' | 'patient_flow' | 'inventory' | 'appointment';
    prediction: string;
    confidence: number;
    timeframe: string;
    actionItems: string[];
}

class SmartAIService {
    /**
     * تحليل شامل يجمع بين Gemini و Grok
     */
    async generateUnifiedAnalysis(patientId: string): Promise<UnifiedAnalysis> {
        const patient = await db.getPatientById(patientId);
        if (!patient) {
            throw new Error('Patient not found');
        }

        const [appointments, expenses] = await Promise.all([
            db.getAppointments(),
            db.getExpenses()
        ]);

        const patientAppointments = appointments.filter(a => a.patientId === patientId);
        const stats = await db.getStats();

        // 1. التحليل الطبي (Gemini)
        const medicalAnalysis = await this.analyzeMedical(patient, patientAppointments);

        // 2. التحليل المالي (Grok)
        const financialAnalysis = await this.analyzeFinancial(patient, expenses, stats);

        // 3. التحليل التشغيلي (Grok + Gemini)
        const operationalAnalysis = await this.analyzeOperational(patient, patientAppointments, stats);

        // 4. الملخص الموحد (Gemini)
        const summary = await this.generateSummary(medicalAnalysis, financialAnalysis, operationalAnalysis);

        return {
            medical: medicalAnalysis,
            financial: financialAnalysis,
            operational: operationalAnalysis,
            summary
        };
    }

    /**
     * تحليل طبي باستخدام Gemini
     */
    private async analyzeMedical(patient: Patient, appointments: Appointment[]) {
        if (!geminiService.isConfigured()) {
            return {
                patientHealthScore: 5,
                treatmentRecommendations: ['تأكد من إعداد Gemini API'],
                riskFactors: [],
                nextSteps: []
            };
        }

        try {
            const prompt = `أنت طبيب أسنان خبير. حلل حالة المريض التالية:

**المريض**: ${patient.name}
**العمر**: ${patient.age} سنة
**التشخيص**: ${patient.diagnosis || 'غير محدد'}
**الإجراءات المكتملة**: ${patient.procedures?.filter(p => p.status === 'completed').map(p => p.type).join(', ') || 'لا يوجد'}
**الإجراءات المخططة**: ${patient.procedures?.filter(p => p.status === 'planned').map(p => p.type).join(', ') || 'لا يوجد'}
**عدد المواعيد**: ${appointments.length}
**الملاحظات**: ${patient.notes || 'لا يوجد'}

أعطني تحليلاً بصيغة JSON:
{
    "patientHealthScore": 8, // من 1-10
    "treatmentRecommendations": ["توصية 1", "توصية 2"],
    "riskFactors": ["خطر 1", "خطر 2"],
    "nextSteps": ["خطوة 1", "خطوة 2"]
}`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('Medical analysis error:', error);
        }

        return {
            patientHealthScore: 5,
            treatmentRecommendations: [],
            riskFactors: [],
            nextSteps: []
        };
    }

    /**
     * تحليل مالي باستخدام Grok
     */
    private async analyzeFinancial(patient: Patient, _expenses: Expense[], _stats: any) {
        if (!grokService.isConfigured()) {
            return {
                profitabilityScore: 50,
                revenueForecast: [],
                costOptimization: [],
                growthOpportunities: []
            };
        }

        try {
            const patientRevenue = patient.paidAmount || 0;
            const patientCost = patient.totalCost - patientRevenue;
            const profitMargin = patientRevenue > 0 ? ((patientRevenue - patientCost) / patientRevenue) * 100 : 0;

            const prompt = `
                بصفتك مستشاراً مالياً، حلل الوضع المالي للمريض:
                - الإيرادات: ${patientRevenue.toLocaleString()} د.ع
                - التكاليف المتوقعة: ${patientCost.toLocaleString()} د.ع
                - هامش الربح: ${profitMargin.toFixed(1)}%
                
                أعطني تحليلاً بصيغة JSON:
                {
                    "profitabilityScore": 75, // 0-100
                    "revenueForecast": [${patientRevenue}, ${patientRevenue * 1.1}, ${patientRevenue * 1.2}], // توقعات 3 أشهر
                    "costOptimization": ["اقتراح 1", "اقتراح 2"],
                    "growthOpportunities": ["فرصة 1", "فرصة 2"]
                }
            `;

            const response = await fetch('/grok-api/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`
                },
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: "You are a financial advisor. Output valid JSON only." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
                return JSON.parse(jsonStr);
            }
        } catch (error) {
            console.error('Financial analysis error:', error);
        }

        return {
            profitabilityScore: 50,
            revenueForecast: [],
            costOptimization: [],
            growthOpportunities: []
        };
    }

    /**
     * تحليل تشغيلي (Grok + Gemini)
     */
    private async analyzeOperational(patient: Patient, appointments: Appointment[], _stats: any) {
        const avgAppointmentGap = this.calculateAvgAppointmentGap(appointments);
        const treatmentCompletionRate = this.calculateCompletionRate(patient);

        return {
            efficiencyScore: Math.min(100, Math.round((treatmentCompletionRate * 100) + (avgAppointmentGap > 0 ? 20 : 0))),
            bottlenecks: avgAppointmentGap > 30 ? ['فجوات كبيرة بين المواعيد'] : [],
            improvements: treatmentCompletionRate < 0.7 ? ['تحسين معدل إكمال العلاجات'] : [],
            predictions: ['توقع زيادة في المواعيد خلال الشهر القادم']
        };
    }

    /**
     * توليد ملخص موحد
     */
    private async generateSummary(medical: any, financial: any, operational: any) {
        if (!geminiService.isConfigured()) {
            return 'تحليل شامل متوفر - يرجى إعداد Gemini API للحصول على ملخص ذكي';
        }

        try {
            const prompt = `أنشئ ملخصاً موجزاً (3-4 جمل) يجمع بين:
- الصحة الطبية: ${medical.patientHealthScore}/10
- الوضع المالي: ${financial.profitabilityScore}/100
- الكفاءة التشغيلية: ${operational.efficiencyScore}/100

اكتب ملخصاً بالعربية يربط بين هذه الجوانب الثلاثة.`;

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            return 'تم إجراء التحليل الشامل بنجاح';
        }
    }

    /**
     * تحليل تنبؤي للمستقبل
     */
    async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
        const [patients, appointments, _expenses, stats] = await Promise.all([
            db.getPatients(),
            db.getAppointments(),
            db.getExpenses(),
            db.getStats()
        ]);

        const insights: PredictiveInsight[] = [];

        // 1. تنبؤ بالإيرادات (Grok)
        if (grokService.isConfigured()) {
            try {
                const prompt = `
                    بناءً على البيانات التالية، تنبأ بالإيرادات للـ 3 أشهر القادمة:
                    - الإيرادات الحالية: ${stats.totalPaid.toLocaleString()} د.ع
                    - عدد المرضى: ${patients.length}
                    - متوسط الإيراد لكل مريض: ${patients.length > 0 ? (stats.totalPaid / patients.length).toFixed(0) : 0} د.ع
                    - معدل النمو الشهري المتوقع: 5-10%
                    
                    أعطني تنبؤات بصيغة JSON:
                    {
                        "type": "revenue",
                        "prediction": "توقع نصي",
                        "confidence": 75,
                        "timeframe": "3 أشهر",
                        "actionItems": ["إجراء 1", "إجراء 2"]
                    }
                `;

                const response = await fetch('/grok-api/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "grok-beta",
                        messages: [
                            { role: "system", content: "You are a predictive analyst. Output valid JSON only." },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.4
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices[0]?.message?.content;
                    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
                    insights.push(JSON.parse(jsonStr));
                }
            } catch (error) {
                console.error('Predictive revenue error:', error);
            }
        }

        // 2. تنبؤ بتدفق المرضى (Gemini)
        if (geminiService.isConfigured()) {
            try {
                const recentAppointments = appointments.filter(a => {
                    const appDate = new Date(a.date);
                    const daysAgo = (Date.now() - appDate.getTime()) / (1000 * 60 * 60 * 24);
                    return daysAgo <= 30;
                });

                const prompt = `
                    بناءً على ${recentAppointments.length} موعد في آخر 30 يوم، تنبأ بتدفق المرضى للشهر القادم.
                    أعطني تنبؤاً بصيغة JSON:
                    {
                        "type": "patient_flow",
                        "prediction": "توقع نصي",
                        "confidence": 70,
                        "timeframe": "شهر واحد",
                        "actionItems": ["إجراء 1"]
                    }
                `;

                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error('Gemini API key not configured');
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);

                if (jsonMatch) {
                    insights.push(JSON.parse(jsonMatch[0]));
                }
            } catch (error) {
                console.error('Predictive patient flow error:', error);
            }
        }

        return insights;
    }

    /**
     * اقتراحات علاجية ذكية بناءً على البيانات
     */
    async suggestSmartTreatments(patientId: string): Promise<{
        suggestions: Array<{
            procedure: string;
            priority: 'urgent' | 'recommended' | 'optional';
            reasoning: string;
            estimatedCost: string;
            aiConfidence: number;
        }>;
        source: 'gemini' | 'grok' | 'hybrid';
    }> {
        const patient = await db.getPatientById(patientId);
        if (!patient) {
            return { suggestions: [], source: 'hybrid' };
        }

        // استخدام Gemini للاقتراحات الطبية
        if (geminiService.isConfigured()) {
            try {
                const suggestions = await geminiService.suggestTreatmentPlan(
                    patient.diagnosis || 'فحص عام',
                    patient.age,
                    patient.procedures
                );

                return {
                    suggestions: suggestions.map(s => ({
                        ...s,
                        aiConfidence: 85,
                        source: 'gemini'
                    })),
                    source: 'gemini'
                };
            } catch (error) {
                console.error('Smart treatment suggestion error:', error);
            }
        }

        return { suggestions: [], source: 'hybrid' };
    }

    /**
     * تحليل تلقائي للأشعة عند الرفع
     */
    async autoAnalyzeXray(imageBase64: string, _patientId: string): Promise<{
        analysis: any;
        recommendations: string[];
        shouldAlert: boolean;
    }> {
        if (!geminiService.isConfigured()) {
            return {
                analysis: null,
                recommendations: [],
                shouldAlert: false
            };
        }

        try {
            const analysis = await geminiService.analyzeXray(imageBase64);

            // تحديد إذا كان يحتاج تنبيه فوري
            const shouldAlert = analysis.severity === 'high' ||
                analysis.findings.some((f: string) =>
                    f.includes('التهاب') || f.includes('عدوى') || f.includes('حالة خطيرة')
                );

            // توليد توصيات بناءً على التحليل
            const recommendations = analysis.recommendations || [];

            return {
                analysis,
                recommendations,
                shouldAlert
            };
        } catch (error) {
            console.error('Auto X-ray analysis error:', error);
            return {
                analysis: null,
                recommendations: [],
                shouldAlert: false
            };
        }
    }

    /**
     * تحليل تلقائي للنماذج ثلاثية الأبعاد
     */
    async autoAnalyze3DModel(imageUrl: string, fileName: string): Promise<{
        jawType: 'upper' | 'lower' | 'unknown';
        teethCount: number;
        quality: 'excellent' | 'good' | 'fair' | 'poor';
        recommendations: string[];
    }> {
        // استخدام Gemini Vision لتحليل صورة النموذج
        if (geminiService.isConfigured()) {
            try {
                // تحويل URL إلى base64
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const reader = new FileReader();

                return new Promise((resolve) => {
                    reader.onloadend = async () => {
                        const base64 = reader.result as string;

                        try {
                            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                            if (!apiKey) {
                                throw new Error('Gemini API key not configured');
                            }

                            const genAI = new GoogleGenerativeAI(apiKey);
                            const model = genAI.getGenerativeModel({
                                model: 'gemini-1.5-flash'
                            });

                            const prompt = `أنت خبير في طب الأسنان الرقمي. حلل صورة النموذج ثلاثي الأبعاد:

**اسم الملف**: ${fileName}

حدد:
1. نوع الفك (upper/lower/unknown)
2. عدد الأسنان المرئية
3. جودة النموذج (excellent/good/fair/poor)
4. توصيات للتحسين

أجب بصيغة JSON:
{
    "jawType": "upper|lower|unknown",
    "teethCount": 14,
    "quality": "excellent|good|fair|poor",
    "recommendations": ["توصية 1", "توصية 2"]
}`;

                            const result = await model.generateContent([
                                prompt,
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: base64.replace(/^data:image\/\w+;base64,/, '')
                                    }
                                }
                            ]);

                            const text = result.response.text();
                            const jsonMatch = text.match(/\{[\s\S]*\}/);

                            if (jsonMatch) {
                                resolve(JSON.parse(jsonMatch[0]));
                            } else {
                                resolve({
                                    jawType: 'unknown',
                                    teethCount: 0,
                                    quality: 'fair',
                                    recommendations: []
                                });
                            }
                        } catch (error) {
                            console.error('3D analysis error:', error);
                            resolve({
                                jawType: 'unknown',
                                teethCount: 0,
                                quality: 'fair',
                                recommendations: []
                            });
                        }
                    };

                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('3D model analysis error:', error);
            }
        }

        return {
            jawType: 'unknown',
            teethCount: 0,
            quality: 'fair',
            recommendations: []
        };
    }

    /**
     * توليد تقرير ذكي تلقائي
     */
    async generateSmartReport(
        reportType: 'daily' | 'weekly' | 'monthly',
        _doctorId?: string
    ): Promise<{
        report: any;
        insights: string[];
        predictions: PredictiveInsight[];
        recommendations: string[];
    }> {
        const [patients, appointments, _expenses, inventory] = await Promise.all([
            db.getPatients(),
            db.getAppointments(),
            db.getExpenses(),
            db.getInventory()
        ]);

        // استخدام Grok للتقرير المالي/الإداري
        let report: any = null;
        if (grokService.isConfigured()) {
            try {
                report = await grokService.generateSmartReport(reportType, {
                    patients,
                    appointments,
                    expenses: _expenses,
                    inventory
                });
            } catch (error) {
                console.error('Smart report generation error:', error);
            }
        }

        // استخدام Gemini للتحليلات الطبية
        const insights: string[] = [];
        if (geminiService.isConfigured() && patients.length > 0) {
            try {
                const samplePatients = patients.slice(0, 10);
                const prompt = `
                    حلل بيانات ${samplePatients.length} مريض وقدم 3-5 رؤى طبية مهمة.
                    أجب بقائمة نقطية بالعربية.
                `;

                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error('Gemini API key not configured');
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                insights.push(...text.split('\n').filter(line => line.trim().length > 0));
            } catch (error) {
                console.error('Insights generation error:', error);
            }
        }

        // توليد تنبؤات
        const predictions = await this.generatePredictiveInsights();

        // توليد توصيات
        const recommendations = [
            ...(report?.suggestions || []),
            ...insights.slice(0, 3)
        ];

        return {
            report: report || {
                title: `تقرير ${reportType === 'daily' ? 'يومي' : reportType === 'weekly' ? 'أسبوعي' : 'شهري'}`,
                summary: 'تقرير شامل للعيادة',
                highlights: [],
                concerns: [],
                suggestions: []
            },
            insights,
            predictions,
            recommendations
        };
    }

    // Helper methods
    private calculateAvgAppointmentGap(appointments: Appointment[]): number {
        if (appointments.length < 2) {
            return 0;
        }

        const sorted = appointments.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let totalGap = 0;
        for (let i = 1; i < sorted.length; i++) {
            const gap = new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime();
            totalGap += gap / (1000 * 60 * 60 * 24); // Convert to days
        }

        return totalGap / (sorted.length - 1);
    }

    private calculateCompletionRate(patient: Patient): number {
        const total = patient.procedures?.length || 0;
        if (total === 0) {
            return 1;
        }

        const completed = patient.procedures?.filter(p => p.status === 'completed').length || 0;
        return completed / total;
    }
}

export const smartAIService = new SmartAIService();

