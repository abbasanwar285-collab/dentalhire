'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store';
import {
    MessageCircle,
    X,
    Send,
    Bot,
    Sparkles,
    Loader2,
    User,
    Briefcase,
    GraduationCap,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
}

export default function AIAssistant() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getWelcomeMessage = (): Message => {
        const role = user?.role || 'job_seeker';
        let content = '';
        let suggestions: string[] = [];

        if (role === 'job_seeker') {
            content = `Hello! I'm your AI career assistant. I can help you with:
            
• Finding the perfect dental job
• Building an impressive CV
• Training and skill development
• Interview preparation
• Career advice

How can I assist you today?`;
            suggestions = [
                'Help me find jobs near me',
                'Review my CV',
                'Recommend training courses',
                'Prepare for an interview'
            ];
        } else if (role === 'clinic') {
            content = `Hello! I'm your AI recruitment assistant. I can help you with:

• Finding qualified candidates
• Writing job descriptions
• Screening applications
• Interview questions
• Hiring best practices

What would you like help with?`;
            suggestions = [
                'Find dental assistants',
                'Write a job posting',
                'Screen candidates',
                'Interview tips'
            ];
        } else {
            content = `Hello! I'm your AI assistant for DentalHire. How can I help you today?`;
            suggestions = [
                'Tell me about DentalHire',
                'How does training work?',
                'Explore features'
            ];
        }

        return {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            suggestions
        };
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage = getWelcomeMessage();
            setMessages([welcomeMessage]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const generateAIResponse = async (userMessage: string): Promise<Message> => {
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const role = user?.role || 'job_seeker';
        let content = '';
        let suggestions: string[] = [];

        // Simple keyword-based responses (in production, this would use a real AI API)
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('job') || lowerMessage.includes('find') || lowerMessage.includes('search')) {
            if (role === 'job_seeker') {
                content = `I can help you find the perfect job! Based on your profile, here are some recommendations:

🎯 **Personalized Job Matches:**
• Dental Assistant at Smile Clinic (2 km away)
• Senior Dental Assistant at Modern Dental (5 km away)
• Orthodontic Assistant at Perfect Smile (3 km away)

💡 **Tips to improve your chances:**
1. Complete your CV to 100%
2. Add a professional photo
3. Get certified through our training courses

Would you like me to show you these jobs in detail?`;
                suggestions = ['Show me these jobs', 'Update my CV', 'Start training'];
            } else {
                content = `I can help you find qualified candidates! Here's what I recommend:

🎯 **Top Candidates for You:**
• Sarah Ahmed - 5 years experience, 98% match
• Mohammed Ali - Certified, 95% match
• Fatima Hassan - Specialized in orthodontics, 92% match

💡 **Hiring Tips:**
1. Review their training certificates
2. Check their CV completion score
3. Send personalized messages

Would you like to see their full profiles?`;
                suggestions = ['View candidates', 'Post a new job', 'Screening tips'];
            }
        } else if (lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
            content = `Let me help you with your CV! 

📊 **Current CV Status:**
• Completion: 75%
• Missing: Professional photo, certifications
• Strength: Strong experience section

✨ **AI Recommendations:**
1. Add a professional headshot (increases views by 40%)
2. Upload your dental assistant certificate
3. Add 2-3 more skills from our suggestions
4. Include specific achievements with numbers

Would you like me to guide you through improving your CV?`;
            suggestions = ['Improve CV now', 'Add certifications', 'Skill suggestions'];
        } else if (lowerMessage.includes('train') || lowerMessage.includes('course') || lowerMessage.includes('learn')) {
            content = `Great choice! Training is key to career growth. 

📚 **Recommended Courses for You:**

1. **Dental Instruments Mastery** ⭐ 4.9/5
   • 3 hours • Beginner
   • 89% of graduates got hired faster

2. **Advanced Infection Control** ⭐ 4.8/5
   • 2.5 hours • Intermediate
   • Certificate included

3. **Patient Communication Skills** ⭐ 4.7/5
   • 2 hours • All levels
   • Highly valued by employers

These courses match your profile and career goals. Start learning today!`;
            suggestions = ['Start first course', 'View all courses', 'My learning path'];
        } else if (lowerMessage.includes('interview') || lowerMessage.includes('prepare')) {
            content = `Let me help you prepare for your interview! 

🎯 **Common Interview Questions:**

1. "Tell me about your experience as a dental assistant"
2. "How do you handle difficult patients?"
3. "What dental instruments are you familiar with?"
4. "Describe your sterilization process"

💡 **AI-Powered Tips:**
• Practice your answers out loud
• Research the clinic beforehand
• Prepare 2-3 questions to ask them
• Dress professionally
• Arrive 10 minutes early

Would you like me to conduct a mock interview with you?`;
            suggestions = ['Mock interview', 'Answer examples', 'Clinic research'];
        } else if (lowerMessage.includes('salary') || lowerMessage.includes('pay')) {
            content = `Let me provide salary insights for your area:

💰 **Dental Assistant Salary Data:**

**Average Salary:**
• Entry Level: $2,500 - $3,200/month
• Mid Level (2-5 years): $3,200 - $4,500/month
• Senior (5+ years): $4,500 - $6,000/month

**Factors Affecting Salary:**
✓ Certifications (+15-20%)
✓ Specialized skills (+10-25%)
✓ Location (urban areas +20%)
✓ Clinic size and reputation

Your profile suggests you could negotiate for the higher end of your range!`;
            suggestions = ['Negotiation tips', 'Get certified', 'Update skills'];
        } else {
            content = `I'm here to help! I can assist you with:

${role === 'job_seeker' ? `
🔍 **Job Search** - Find perfect matches
📝 **CV Building** - Create impressive resumes
📚 **Training** - Develop your skills
💼 **Career Advice** - Get personalized guidance
💰 **Salary Insights** - Know your worth
` : `
👥 **Find Candidates** - Match with qualified professionals
📋 **Job Postings** - Create effective listings
✅ **Screening** - Evaluate applicants efficiently
💡 **Hiring Tips** - Best recruitment practices
`}

What would you like to explore?`;
            suggestions = role === 'job_seeker'
                ? ['Find jobs', 'Build CV', 'Start training', 'Career tips']
                : ['Find candidates', 'Post job', 'Screen applicants', 'Hiring guide'];
        }

        return {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            suggestions
        };
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        const aiResponse = await generateAIResponse(input);
        setIsTyping(false);
        setMessages(prev => [...prev, aiResponse]);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        handleSend();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50 group"
                aria-label="Open AI Assistant"
            >
                <Bot size={24} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                <div className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    AI Assistant
                    <Sparkles size={14} className="inline ml-1" />
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold">AI Assistant</h3>
                        <p className="text-xs text-white/80 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            Always learning
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                    aria-label="Close AI Assistant"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}>
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            message.role === 'assistant'
                                ? 'bg-gradient-to-br from-blue-500 to-teal-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        )}>
                            {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                        </div>
                        <div className={cn('flex-1', message.role === 'user' && 'flex flex-col items-end')}>
                            <div className={cn(
                                'rounded-2xl px-4 py-3 max-w-[85%]',
                                message.role === 'assistant'
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : 'bg-blue-500 text-white'
                            )}>
                                <p className="text-sm whitespace-pre-line">{message.content}</p>
                            </div>
                            {message.suggestions && message.suggestions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {message.suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                            <Loader2 size={18} className="animate-spin text-gray-600 dark:text-gray-300" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-2 bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    AI-powered • Learns from interactions
                </p>
            </div>
        </div>
    );
}
