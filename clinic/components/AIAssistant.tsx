import React, { useState, useRef, useEffect } from 'react';
import {
    Bot,
    X,
    Send,
    Loader2,
    Brain,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { geminiService, ChatResponse } from '../services/geminiService';
import { grokService } from '../services/grokService';
import { Patient, Appointment } from '../types';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIAssistantProps {
    patients?: Patient[];
    appointments?: Appointment[];
    onClose?: () => void;
    isOpen?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
    patients = [],
    appointments = [],
    onClose,
    isOpen = false
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeAI, setActiveAI] = useState<'gemini' | 'grok'>('gemini');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const geminiAvailable = geminiService.isConfigured();
    const grokAvailable = grokService.isConfigured();

    useEffect(() => {
        if (!geminiAvailable && grokAvailable) {
            setActiveAI('grok');
        } else if (geminiAvailable) {
            setActiveAI('gemini');
        }
    }, [geminiAvailable, grokAvailable]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Add welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'مرحباً! أنا المساعد الذكي لعيادتك 🦷\n\nبإمكاني مساعدتك عبر:\n• **Dr. Gemini:** الأسئلة الطبية والأشعة\n• **Mr. Grok:** الأمور المالية والإدارية\n\nكيف يمكنني مساعدتك؟',
                timestamp: new Date()
            }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

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
            let response: string;

            if (activeAI === 'gemini' && geminiAvailable) {
                const result: ChatResponse = await geminiService.askAboutPatients(
                    userMessage.content,
                    { patients, appointments }
                );
                response = result.answer;
            } else if (activeAI === 'grok' && grokAvailable) {
                const result = await grokService.askAboutPatients(
                    userMessage.content,
                    { patients, appointments }
                );
                response = result.answer;
            } else {
                response = 'عذراً، خدمة الذكاء الاصطناعي المختارة غير متوفرة. يرجى التحقق من إعدادات API.';
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
                timestamp: new Date()
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
        { label: 'المرضى المديونين', query: 'من هم المرضى الذين لديهم مديونية عالية؟' },
        { label: 'مواعيد اليوم', query: 'ما هي مواعيد اليوم؟' },
        { label: 'تحليل مالي', query: 'قم بتحليل الوضع المالي للعيادة' },
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => onClose?.()}
                className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
                title="المساعد الذكي"
            >
                <Bot className="w-7 h-7" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 left-6 z-50 ${isExpanded ? 'w-96 h-[600px]' : 'w-80 h-[450px]'} bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">المساعد الذكي ({activeAI === 'gemini' ? 'Gemini' : 'Grok'})</h3>
                        <div className="flex items-center gap-1 mt-1">
                            <button
                                onClick={() => setActiveAI('gemini')}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeAI === 'gemini' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-400'}`}
                            >
                                Gemini
                            </button>
                            <button
                                onClick={() => setActiveAI('grok')}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeAI === 'grok' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-400'}`}
                            >
                                Grok
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title={isExpanded ? 'تصغير' : 'تكبير'}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="إغلاق"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
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
                                : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <p className="text-xs opacity-50 mt-1">
                                {message.timestamp.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-end">
                        <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-sm">
                            <div className="flex items-center gap-2 text-gray-400">
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

export default AIAssistant;
