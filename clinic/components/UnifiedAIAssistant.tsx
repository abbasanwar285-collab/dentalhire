/**
 * Unified AI Assistant - دمج Gemini + Grok معاً
 * 
 * مساعد ذكي متقدم يجمع بين قدرات Gemini (الطبية) و Grok (المالية/الإدارية)
 * في محادثة واحدة ذكية
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { grokService } from '../services/grokService';
// import { smartAIService } from '../services/smartAIService'; // TODO: Enable when needed
import { Patient, Appointment } from '../types';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    aiSource?: 'gemini' | 'grok' | 'unified';
    type?: 'medical' | 'financial' | 'operational' | 'general';
}

interface UnifiedAIAssistantProps {
    patients?: Patient[];
    appointments?: Appointment[];
    onClose?: () => void;
    isOpen?: boolean;
}

export const UnifiedAIAssistant: React.FC<UnifiedAIAssistantProps> = ({
    patients = [],
    appointments = [],
    onClose,
    isOpen = false
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeMode, setActiveMode] = useState<'unified' | 'gemini' | 'grok'>('unified');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const geminiAvailable = geminiService.isConfigured();
    const grokAvailable = grokService.isConfigured();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `مرحباً! أنا المساعد الذكي الموحد 🦷✨\n\nأستطيع مساعدتك عبر:\n• **Unified Mode (الموحد)**: دمج Gemini + Grok معاً\n• **Dr. Gemini**: الأسئلة الطبية والأشعة\n• **Mr. Grok**: الأمور المالية والإدارية\n\nكيف يمكنني مساعدتك؟`,
                timestamp: new Date(),
                aiSource: 'unified',
                type: 'general'
            }]);
        }
    }, [isOpen, messages.length]);

    const detectQueryType = (query: string): 'medical' | 'financial' | 'operational' | 'general' => {
        const lowerQuery = query.toLowerCase();
        const medicalKeywords = ['مريض', 'علاج', 'تشخيص', 'أشعة', 'إجراء', 'طبي', 'صحة', 'أسنان', 'تقويم'];
        const financialKeywords = ['مالي', 'إيراد', 'مصروف', 'ربح', 'تكلفة', 'دفع', 'مديونية', 'ميزانية'];
        const operationalKeywords = ['موعد', 'جدول', 'مخزون', 'موظف', 'إدارة', 'عملية'];

        if (medicalKeywords.some(kw => lowerQuery.includes(kw))) {
            return 'medical';
        }
        if (financialKeywords.some(kw => lowerQuery.includes(kw))) {
            return 'financial';
        }
        if (operationalKeywords.some(kw => lowerQuery.includes(kw))) {
            return 'operational';
        }
        return 'general';
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) {
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const queryType = detectQueryType(userMessage.content);
            let response: string;
            let aiSource: 'gemini' | 'grok' | 'unified' = 'unified';

            if (activeMode === 'unified' && geminiAvailable && grokAvailable) {
                // Unified Mode: Use both AIs intelligently
                const [geminiResponse, grokResponse] = await Promise.all([
                    geminiService.askAboutPatients(userMessage.content, { patients, appointments })
                        .catch(() => ({ answer: '', sources: [] })),
                    grokService.askAboutPatients(userMessage.content, { patients, appointments })
                        .catch(() => ({ answer: '', sources: [] }))
                ]);

                // Combine responses intelligently based on query type
                if (queryType === 'medical') {
                    response = `**من Dr. Gemini (الطبي):**\n${geminiResponse.answer}\n\n${grokResponse.answer ? `**ملاحظة من Mr. Grok:**\n${grokResponse.answer}` : ''}`;
                    aiSource = 'unified';
                } else if (queryType === 'financial') {
                    response = `**من Mr. Grok (المالي):**\n${grokResponse.answer}\n\n${geminiResponse.answer ? `**ملاحظة من Dr. Gemini:**\n${geminiResponse.answer}` : ''}`;
                    aiSource = 'unified';
                } else {
                    response = `**تحليل موحد:**\n\n**الجانب الطبي (Gemini):**\n${geminiResponse.answer}\n\n**الجانب المالي/الإداري (Grok):**\n${grokResponse.answer}`;
                    aiSource = 'unified';
                }
            } else if (activeMode === 'gemini' && geminiAvailable) {
                const result = await geminiService.askAboutPatients(userMessage.content, { patients, appointments });
                response = result.answer;
                aiSource = 'gemini';
            } else if (activeMode === 'grok' && grokAvailable) {
                const result = await grokService.askAboutPatients(userMessage.content, { patients, appointments });
                response = result.answer;
                aiSource = 'grok';
            } else {
                response = 'عذراً، خدمة الذكاء الاصطناعي المختارة غير متوفرة. يرجى التحقق من إعدادات API.';
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                aiSource,
                type: queryType
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
                timestamp: new Date(),
                aiSource: 'unified'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        { label: 'تحليل شامل', query: 'قم بتحليل شامل للعيادة (طبي + مالي + تشغيلي)', type: 'unified' as const },
        { label: 'المرضى المديونين', query: 'من هم المرضى الذين لديهم مديونية عالية؟', type: 'financial' as const },
        { label: 'اقتراحات علاجية', query: 'ما هي أفضل اقتراحات العلاج للمرضى؟', type: 'medical' as const },
        { label: 'تنبؤات مستقبلية', query: 'ما هي توقعات الإيرادات للشهر القادم؟', type: 'financial' as const },
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => onClose?.()}
                className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
                title="المساعد الذكي الموحد"
            >
                <Brain className="w-7 h-7" />
            </button>
        );
    }

    const getAIIcon = (source?: string) => {
        switch (source) {
            case 'gemini': return <Sparkles className="w-4 h-4 text-blue-400" />;
            case 'grok': return <TrendingUp className="w-4 h-4 text-orange-400" />;
            case 'unified': return <Brain className="w-4 h-4 text-violet-400" />;
            default: return <Bot className="w-4 h-4 text-gray-400" />;
        }
    };

    const getAIColor = (source?: string) => {
        switch (source) {
            case 'gemini': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'grok': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'unified': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-violet-900/50 via-indigo-900/50 to-purple-900/50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">المساعد الذكي الموحد</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <button
                                onClick={() => setActiveMode('unified')}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeMode === 'unified' ? 'bg-violet-500/20 text-violet-400' : 'text-gray-500 hover:text-gray-400'}`}
                            >
                                Unified
                            </button>
                            <button
                                onClick={() => setActiveMode('gemini')}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeMode === 'gemini' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-400'}`}
                            >
                                Gemini
                            </button>
                            <button
                                onClick={() => setActiveMode('grok')}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeMode === 'grok' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-400'}`}
                            >
                                Grok
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="إغلاق"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
                <div className="p-3 border-b border-gray-700/50">
                    <p className="text-xs text-gray-500 mb-2">أسئلة سريعة:</p>
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(action.query);
                                    inputRef.current?.focus();
                                }}
                                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl ${message.role === 'user'
                                ? 'bg-violet-600 text-white rounded-tr-sm'
                                : `bg-gray-800 text-gray-100 rounded-tl-sm border ${getAIColor(message.aiSource)}`
                                }`}
                        >
                            {message.role === 'assistant' && message.aiSource && (
                                <div className="flex items-center gap-1 mb-1">
                                    {getAIIcon(message.aiSource)}
                                    <span className="text-[10px] opacity-70">
                                        {message.aiSource === 'unified' ? 'Unified AI' : message.aiSource === 'gemini' ? 'Dr. Gemini' : 'Mr. Grok'}
                                    </span>
                                </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className="text-xs opacity-50 mt-1">
                                {message.timestamp.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-end">
                        <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-sm border border-violet-500/30">
                            <div className="flex items-center gap-2 text-violet-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">جاري التفكير...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700">
                <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="اكتب سؤالك هنا..."
                        className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                        title="إرسال"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnifiedAIAssistant;

