'use client';

// ============================================
// DentalHire - Messages Page
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useMessageStore, useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Input } from '@/components/shared';
import { formatRelativeTime } from '@/lib/utils';
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    Smile,
    Check,
    CheckCheck,
    ArrowLeft,
    ArrowRight,
    MessageSquare,
} from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuthStore();
    const { language, t } = useLanguage();
    const {
        conversations,
        activeConversationId,
        setActiveConversation,
        sendMessage,
        getMessages,
        getConversation,
        loadConversations,
        subscribeToMessages,
        isLoading,
    } = useMessageStore();

    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = activeConversationId
        ? getConversation(activeConversationId)
        : null;

    const messages = activeConversationId
        ? getMessages(activeConversationId)
        : [];

    // Load conversations on mount
    useEffect(() => {
        if (user?.id) {
            loadConversations(user.id);
            const unsubscribe = subscribeToMessages(user.id);
            return () => unsubscribe();
        }
    }, [user?.id, loadConversations, subscribeToMessages]);

    // Filter conversations by search
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery) return true;
        const otherParticipant = Object.entries(conv.participantNames).find(
            ([id]) => id !== user?.id
        );
        return otherParticipant?.[1]
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
    });

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !activeConversationId || !user) return;
        const userName = `${user.profile.firstName} ${user.profile.lastName}`;
        await sendMessage(activeConversationId, message.trim(), user.id, userName);
        setMessage('');
    };

    const getOtherParticipantName = (conv: typeof conversations[0]) => {
        const other = Object.entries(conv.participantNames).find(
            ([id]) => id !== user?.id
        );
        return other?.[1] || (language === 'ar' ? 'غير معروف' : 'Unknown');
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-0 -m-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Conversations List */}
            <div
                className={`w-80 border-e border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {language === 'ar' ? 'الرسائل' : 'Messages'}
                    </h2>
                    <Input
                        placeholder={language === 'ar' ? 'بحث في المحادثات...' : 'Search conversations...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv.id)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 ${activeConversationId === conv.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {getOtherParticipantName(conv).charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0 text-start">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {getOtherParticipantName(conv)}
                                        </h3>
                                        {conv.lastMessage && (
                                            <span className="text-xs text-gray-500">
                                                {formatRelativeTime(conv.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    {conv.lastMessage && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                            {conv.lastMessage.senderId === user?.id && (
                                                <span className="text-gray-400">{language === 'ar' ? 'أنت: ' : 'You: '}</span>
                                            )}
                                            {conv.lastMessage.content}
                                        </p>
                                    )}
                                    {conv.unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full mt-1">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">{language === 'ar' ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div
                className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!activeConversationId ? 'hidden md:flex' : 'flex'
                    }`}
            >
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden p-2 -ms-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    aria-label={language === 'ar' ? 'رجوع' : 'Back'}
                                >
                                    {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                    {getOtherParticipantName(activeConversation).charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {getOtherParticipantName(activeConversation)}
                                    </h3>
                                    <p className="text-xs text-green-500">{language === 'ar' ? 'متصل' : 'Online'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={language === 'ar' ? 'مكالمة صوتية' : 'Phone call'}>
                                    <Phone size={20} />
                                </button>
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={language === 'ar' ? 'مكالمة فيديو' : 'Video call'}>
                                    <Video size={20} />
                                </button>
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={language === 'ar' ? 'خيارات أخرى' : 'More options'}>
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isOwn = msg.senderId === user?.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${isOwn
                                                ? `bg-blue-500 text-white ${language === 'ar' ? 'rounded-bl-md' : 'rounded-br-md'}`
                                                : `bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${language === 'ar' ? 'rounded-br-md' : 'rounded-bl-md'} shadow-sm`
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <div
                                                className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'
                                                    }`}
                                            >
                                                <span>{formatRelativeTime(msg.timestamp)}</span>
                                                {isOwn && (
                                                    msg.read ? (
                                                        <CheckCheck size={14} className="text-blue-200" />
                                                    ) : (
                                                        <Check size={14} />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}>
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="text"
                                    placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={language === 'ar' ? 'رموز تعبيرية' : 'Emoji'}>
                                    <Smile size={20} />
                                </button>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                    className="rounded-full w-10 h-10 p-0"
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                            <MessageSquare size={48} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {language === 'ar' ? 'رسائلك' : 'Your Messages'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                            {language === 'ar'
                                ? 'اختر محادثة لبدء الدردشة أو ابحث عن المرشحين لبدء محادثة جديدة.'
                                : 'Select a conversation to start chatting or search for candidates to begin a new conversation.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
