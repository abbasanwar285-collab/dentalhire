import { Patient, Appointment } from '../types';

const API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
// Use local proxy to avoid CORS/Region blocking
const API_URL = '/grok-api/chat/completions';

export interface ChatResponse {
    answer: string;
    sources: string[];
}

export interface SmartReport {
    title: string;
    summary: string;
    highlights: string[];
    concerns: string[];
    suggestions: string[];
}

class GrokService {
    private headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    };

    isConfigured(): boolean {
        return !!API_KEY;
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        if (!this.isConfigured()) {
            return { success: false, message: 'مفتاح API غير موجود' };
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "Test connection. Reply with 'OK'." }
                    ],
                    stream: false,
                    temperature: 0
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for region blocking specifically
                if (response.status === 403 && errorText.includes('region')) {
                    return { success: false, message: 'الخدمة غير متوفرة في منطقتك (محظورة)' };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true, message: 'تم الاتصال بنجاح' };
        } catch (error) {
            console.error('Grok connection test error:', error);
            return { success: false, message: error instanceof Error ? error.message : 'فشل الاتصال' };
        }
    }

    async askAboutPatients(query: string, context: { patients: Patient[], appointments: Appointment[] }): Promise<ChatResponse> {
        if (!this.isConfigured()) {
            throw new Error('Grok API key is not configured');
        }

        try {
            const systemContext = `
                أنت مساعد ذكي لعيادة أسنان (Grok). لديك البيانات التالية:
                - عدد المرضى: ${context.patients.length}
                - عدد المواعيد: ${context.appointments.length}
                
                أجب عن سؤال المستخدم باللغة العربية بأسلوب مهني ومختصر.
                استخدم البيانات المقدمة لدعم إجابتك.
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: systemContext },
                        { role: "user", content: query }
                    ],
                    stream: false,
                    temperature: 0.5
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const answer = data.choices[0]?.message?.content || 'عذراً، لم أستطع توليد إجابة.';

            return {
                answer,
                sources: ['سجلات العيادة']
            };
        } catch (error) {
            console.error('Grok chat error:', error);
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
            const prompt = `
                بصفتك المدير المالي لعيادة أسنان (Grok)، قم بتحليل البيانات التالية:
                - الإيرادات: ${data.revenue}
                - المصروفات: ${data.expenses}
                - الأرباح: ${data.profit}
                - أفضل العلاجات: ${data.topTreatments.join(', ')}
                
                لخص التحليل في JSON يحتوي على:
                - healthScore (0-100)
                - profitabilityAnalysis (نص)
                - growthOpportunity (نص)
                - riskAlert (نص)
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: "You are a financial analyst. Output valid JSON only." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }
            const result = await response.json();
            const content = result.choices[0]?.message?.content;
            const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error('Grok financial analysis error:', error);
            return {
                healthScore: 0,
                profitabilityAnalysis: "تعذر التحليل",
                growthOpportunity: "يرجى المحاولة لاحقاً",
                riskAlert: "خطأ في الاتصال"
            };
        }
    }

    async generateSmartReport(
        reportType: 'daily' | 'weekly' | 'monthly',
        data: any
    ): Promise<SmartReport> {
        try {
            const prompt = `
                بصفتك مدير العيادة (Grok)، أنشئ تقريراً ${reportType} بناءً على البيانات:
                ${JSON.stringify(data)}
                
                المخرجات المطلوبة JSON:
                {
                    "title": "عنوان التقرير",
                    "summary": "ملخص",
                    "highlights": ["نقطة 1", "نقطة 2"],
                    "concerns": ["تخوف 1"],
                    "suggestions": ["اقتراح 1"]
                }
            `;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: "You are a clinic manager. Output valid JSON only." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.4
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }
            const result = await response.json();
            const content = result.choices[0]?.message?.content;
            const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);

        } catch (error) {
            console.error('Grok report error:', error);
            throw error;
        }
    }
}

export const grokService = new GrokService();
