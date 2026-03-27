/**
 * Gemini AI Service
 * 
 * Google Gemini AI integration for dental clinic management.
 * Provides X-ray analysis, treatment suggestions, and patient summaries.
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Patient, Procedure } from '../types';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI && API_KEY) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }
    if (!genAI) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }
    return genAI;
}

// Safety settings for medical content
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export interface XrayAIAnalysis {
    findings: string[];
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
    confidence: number;
    rawAnalysis: string;
}

export interface TreatmentSuggestion {
    procedure: string;
    priority: 'urgent' | 'recommended' | 'optional';
    estimatedCost: string;
    reasoning: string;
}

export interface PatientSummary {
    overview: string;
    treatmentProgress: string;
    financialStatus: string;
    recommendations: string[];
    clinicalScore: number; // 1-10 health score
    nextBestAction: string; // The single most important next step
}

class GeminiService {
    private isAvailable = !!API_KEY;

    /**
     * Check if the service is configured and available
     */
    isConfigured(): boolean {
        return this.isAvailable;
    }

    /**
     * Test the API connection
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('Say "مرحباً! Gemini جاهز للعمل" in exactly those words.');
            const text = result.response.text();
            return { success: true, message: text };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, message };
        }
    }

    /**
     * Analyze dental X-ray image using Gemini Vision
     */
    async analyzeXray(imageBase64: string): Promise<XrayAIAnalysis> {
        try {
            const model = getGenAI().getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings
            });

            // Remove data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

            const prompt = `أنت طبيب أسنان خبير. قم بتحليل صورة الأشعة السينية هذه وأعطني:

1. **النتائج** (Findings): قائمة بالملاحظات المهمة (تسوس، التهاب، فقدان عظم، حشوات، تيجان، إلخ)
2. **الشدة** (Severity): low أو medium أو high
3. **التوصيات** (Recommendations): قائمة بالإجراءات المقترحة
4. **الثقة** (Confidence): نسبة مئوية 0-100

أجب بصيغة JSON فقط:
{
    "findings": ["...", "..."],
    "severity": "low|medium|high",
    "recommendations": ["...", "..."],
    "confidence": 85,
    "rawAnalysis": "ملخص نصي قصير"
}

⚠️ تنويه: هذا للمساعدة فقط وليس بديلاً عن التشخيص الطبي.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }
                }
            ]);

            const text = result.response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    findings: parsed.findings || [],
                    severity: parsed.severity || 'low',
                    recommendations: parsed.recommendations || [],
                    confidence: parsed.confidence || 70,
                    rawAnalysis: parsed.rawAnalysis || text
                };
            }

            // Fallback if JSON parsing fails
            return {
                findings: ['تم تحليل الصورة'],
                severity: 'low',
                recommendations: ['يرجى مراجعة الطبيب للتشخيص الدقيق'],
                confidence: 50,
                rawAnalysis: text
            };
        } catch (error) {
            console.error('Gemini X-ray analysis error:', error);
            throw error;
        }
    }

    /**
     * Generate treatment plan suggestions based on diagnosis
     */
    async suggestTreatmentPlan(
        diagnosis: string,
        patientAge: number,
        existingProcedures?: Procedure[]
    ): Promise<TreatmentSuggestion[]> {
        try {
            const model = getGenAI().getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings
            });

            const existingTreatments = existingProcedures
                ?.map(p => `${p.type} (${p.status})`)
                .join(', ') || 'لا يوجد';

            const prompt = `أنت طبيب أسنان خبير. بناءً على المعلومات التالية، اقترح خطة علاج:

**التشخيص**: ${diagnosis}
**عمر المريض**: ${patientAge} سنة
**العلاجات الحالية**: ${existingTreatments}

أعطني قائمة بالإجراءات المقترحة بصيغة JSON:
[
    {
        "procedure": "اسم الإجراء بالعربية",
        "priority": "urgent|recommended|optional",
        "estimatedCost": "نطاق السعر بالدينار العراقي",
        "reasoning": "سبب الاقتراح"
    }
]

اجعل الاقتراحات عملية ومناسبة لعيادة أسنان في العراق.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Extract JSON array from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('Gemini treatment suggestion error:', error);
            throw error;
        }
    }

    /**
     * Generate a comprehensive patient summary
     */
    async generatePatientSummary(patient: Patient): Promise<PatientSummary> {
        try {
            const model = getGenAI().getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings
            });

            const completedProcedures = patient.procedures?.filter(p => p.status === 'completed') || [];
            const plannedProcedures = patient.procedures?.filter(p => p.status === 'planned') || [];
            const remainingBalance = patient.totalCost - (patient.paidAmount || 0);

            const prompt = `أنت مساعد طبي ذكي. قم بإنشاء ملخص شامل للمريض:

**الاسم**: ${patient.name}
**العمر**: ${patient.age} سنة
**التشخيص**: ${patient.diagnosis || 'غير محدد'}
**الإجراءات المكتملة**: ${completedProcedures.map(p => p.type).join(', ') || 'لا يوجد'}
**الإجراءات المخططة**: ${plannedProcedures.map(p => p.type).join(', ') || 'لا يوجد'}
**إجمالي التكلفة**: ${patient.totalCost.toLocaleString()} د.ع
**المدفوع**: ${(patient.paidAmount || 0).toLocaleString()} د.ع
**المتبقي**: ${remainingBalance.toLocaleString()} د.ع
${patient.notes ? `**ملاحظات**: ${patient.notes}` : ''}

أعطني ملخصاً بصيغة JSON:
{
    "overview": "نظرة عامة على حالة المريض",
    "treatmentProgress": "تقدم العلاج",
    "financialStatus": "الحالة المالية",
    "recommendations": ["توصية 1", "توصية 2"],
    "clinicalScore": 8, // تقييم صحة المريض من 1 (سيء) إلى 10 (ممتاز) بناءً على الإجراءات المكتملة
    "nextBestAction": "أهم خطوة قادمة يجب على الطبيب فعلها (مثلاً: إكمال الدفع، بدء حشوة، متابعة)"
}`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {
                overview: 'ملخص غير متوفر',
                treatmentProgress: 'بيانات غير كافية',
                financialStatus: `المتبقي: ${remainingBalance.toLocaleString()} د.ع`,
                recommendations: [],
                clinicalScore: 5,
                nextBestAction: 'مراجعة الطبيب'
            };
        } catch (error) {
            console.error('Gemini patient summary error:', error);
            throw error;
        }
    }

    /**
     * Translate notes between Arabic and English
     */
    async translateNotes(text: string, targetLanguage: 'ar' | 'en'): Promise<string> {
        try {
            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });

            const targetName = targetLanguage === 'ar' ? 'العربية' : 'English';
            const prompt = `ترجم النص التالي إلى ${targetName}. أعط الترجمة فقط بدون شرح:

"${text}"`;

            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Gemini translation error:', error);
            throw error;
        }
    }

    /**
     * Ask a question about dental topics
     */
    async askDentalQuestion(question: string): Promise<string> {
        try {
            const model = getGenAI().getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings
            });

            const prompt = `أنت مساعد طبي متخصص في طب الأسنان. أجب على السؤال التالي بشكل مختصر ومفيد:

${question}

ملاحظة: هذا للمساعدة العامة فقط وليس بديلاً عن الاستشارة الطبية.`;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Gemini dental question error:', error);
            throw error;
        }
    }
    async analyzeFinancialHealth(data: {
        revenue: number;
        expenses: number;
        profit: number;
        topTreatments: string[];
        doctorPerformance: { name: string; revenue: number }[];
    }): Promise<{
        healthScore: number;
        profitabilityAnalysis: string;
        growthOpportunity: string;
        riskAlert: string;
    }> {
        try {
            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `
                بصفتك مستشارًا ماليًا متخصصًا في العيادات الطبية، قم بتحليل البيانات التالية لعيادة أسنان:
                
                - الإيرادات الكلية المتوقعة: ${data.revenue.toLocaleString()} دينار
                - المصروفات الكلية: ${data.expenses.toLocaleString()} دينار
                - صافي الربح التقديري: ${data.profit.toLocaleString()} دينار
                - أكثر 3 علاجات طلباً: ${data.topTreatments.join(', ')}
                - أداء الأطباء: ${data.doctorPerformance.map(d => `${d.name}: ${d.revenue.toLocaleString()}`).join(', ')}

                المطلوب:
                1. حساب درجة الصحة المالية (0-100).
                2. تحليل موجز للربحية (جملة واحدة).
                3. تحديد أكبر فرصة للنمو (جملة واحدة).
                4. تحديد أكبر خطر مالي أو تنبيه (جملة واحدة).

                أجب بصيغة JSON فقط:
                {
                    "healthScore": 85,
                    "profitabilityAnalysis": "تحليل الربحية هنا",
                    "growthOpportunity": "فرصة النمو هنا",
                    "riskAlert": "تنبيه الخطر هنا"
                }
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean up code blocks if generic response includes them
            const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();

            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Gemini financial analysis error:', error);
            return {
                healthScore: 0,
                profitabilityAnalysis: "تعذر إجراء التحليل المالي في الوقت الحالي.",
                growthOpportunity: "يرجى المحاولة لاحقاً.",
                riskAlert: "تأكد من اتصال الإنترنت."
            };
        }
    }

    /**
     * Generate a smart report based on clinic data
     */
    async generateSmartReport(
        reportType: 'daily' | 'weekly' | 'monthly',
        data: {
            patients?: any[];
            appointments?: any[];
            expenses?: any[];
            inventory?: any[];
        }
    ): Promise<SmartReport> {
        try {
            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
            const stats = {
                totalPatients: data.patients?.length || 0,
                newPatients: data.patients?.filter(p => {
                    const created = new Date(p.createdAt);
                    const daysAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
                    return reportType === 'daily' ? daysAgo <= 1 :
                        reportType === 'weekly' ? daysAgo <= 7 : daysAgo <= 30;
                }).length || 0,
                totalAppointments: data.appointments?.length || 0,
                completedAppointments: data.appointments?.filter(a => a.status === 'completed').length || 0,
                totalRevenue: data.patients?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0,
                totalExpenses: data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
                lowStockItems: data.inventory?.filter(i => i.quantity < (i.minStock || 5)).length || 0
            };

            const periodName = reportType === 'daily' ? 'اليومي' :
                reportType === 'weekly' ? 'الأسبوعي' : 'الشهري';

            const prompt = `أنت محلل بيانات ذكي لعيادة أسنان.أنشئ تقريراً ${periodName}:

** الإحصائيات **:
- إجمالي المرضى: ${stats.totalPatients}
- مرضى جدد: ${stats.newPatients}
- المواعيد: ${stats.totalAppointments} (مكتمل: ${stats.completedAppointments})
- الإيرادات: ${stats.totalRevenue.toLocaleString()} د.ع
    - المصروفات: ${stats.totalExpenses.toLocaleString()} د.ع
        - صافي الربح: ${(stats.totalRevenue - stats.totalExpenses).toLocaleString()} د.ع
            - عناصر مخزون منخفضة: ${stats.lowStockItems}

أنشئ تقريراً بصيغة JSON:
{
    "title": "عنوان التقرير",
        "summary": "ملخص شامل",
            "highlights": ["إنجاز 1", "إنجاز 2"],
                "concerns": ["مشكلة 1", "مشكلة 2"],
                    "suggestions": ["اقتراح 1", "اقتراح 2"]
} `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanText = responseText.replace(/```json\n ?|\n ? ```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error('Gemini report generation error:', error);
            throw error;
        }
    }

    /**
     * Chat with the AI about patient data
     */
    async askAboutPatients(
        question: string,
        context: {
            patients?: any[];
            appointments?: any[];
        }
    ): Promise<ChatResponse> {
        try {
            const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
            // Create a summarized context
            const patientSummary = context.patients?.slice(0, 50).map(p => ({
                name: p.name,
                age: p.age,
                diagnosis: p.diagnosis,
                totalCost: p.totalCost,
                paidAmount: p.paidAmount,
                proceduresCount: p.procedures?.length || 0
            })) || [];

            const appointmentSummary = context.appointments?.slice(0, 30).map(a => ({
                patientName: a.patientName,
                date: a.date,
                type: a.type,
                status: a.status
            })) || [];

            const prompt = `أنت مساعد ذكي لعيادة أسنان.لديك البيانات التالية:

** المرضى ** (${patientSummary.length} مريض):
${JSON.stringify(patientSummary.slice(0, 20), null, 2)}

** المواعيد ** (${appointmentSummary.length} موعد):
${JSON.stringify(appointmentSummary.slice(0, 10), null, 2)}

** السؤال **: ${question}

أجب باللغة العربية بشكل مختصر ومفيد.`;

            const result = await model.generateContent(prompt);
            return {
                answer: result.response.text(),
                sources: ['بيانات المرضى', 'سجل المواعيد']
            };
        } catch (error) {
            console.error('Gemini chat error:', error);
            throw error;
        }
    }
}

export interface SmartReport {
    title: string;
    summary: string;
    highlights: string[];
    concerns: string[];
    suggestions: string[];
}

export interface ChatResponse {
    answer: string;
    sources: string[];
}

export const geminiService = new GeminiService();
