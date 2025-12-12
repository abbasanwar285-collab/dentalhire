'use client';

// ============================================
// DentalHire - Message Store with Supabase
// ============================================

import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase';
import { Message, Conversation } from '@/types';
import { generateId } from '@/lib/utils';

interface MessageState {
    conversations: Conversation[];
    activeConversationId: string | null;
    isLoading: boolean;
    unreadCount: number;

    // Actions
    setActiveConversation: (id: string | null) => void;
    sendMessage: (conversationId: string, content: string, senderId: string, senderName: string) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    createConversation: (participants: string[], participantNames: { [key: string]: string }) => Promise<string>;
    loadConversations: (userId: string) => Promise<void>;
    getConversation: (id: string) => Conversation | undefined;
    getMessages: (conversationId: string) => Message[];
    deleteConversation: (id: string) => Promise<void>;
    subscribeToMessages: (userId: string) => () => void;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    unreadCount: 0,

    setActiveConversation: (id) => {
        set({ activeConversationId: id });
        if (id) {
            get().markAsRead(id);
        }
    },

    loadConversations: async (userId: string) => {
        set({ isLoading: true });
        try {
            const supabase = getSupabaseClient();

            // Get conversations where user is a participant
            const { data: convData, error: convError } = await (supabase
                .from('conversations') as any)
                .select('*')
                .contains('participants', [userId])
                .order('updated_at', { ascending: false });

            if (convError) {
                console.error('Error loading conversations:', convError);
                return;
            }

            if (convData) {
                // Load messages for each conversation
                const conversationsWithMessages: Conversation[] = await Promise.all(
                    convData.map(async (conv: any) => {
                        const { data: messages } = await (supabase
                            .from('messages') as any)
                            .select('*')
                            .eq('conversation_id', conv.id)
                            .order('created_at', { ascending: true });

                        const formattedMessages: Message[] = (messages || []).map((msg: any) => ({
                            id: msg.id,
                            conversationId: msg.conversation_id,
                            senderId: msg.sender_id,
                            senderName: msg.sender_name,
                            content: msg.content,
                            timestamp: new Date(msg.created_at),
                            read: msg.read,
                        }));

                        const lastMessage = formattedMessages[formattedMessages.length - 1];

                        return {
                            id: conv.id,
                            participants: conv.participants,
                            participantNames: conv.participant_names as { [key: string]: string },
                            messages: formattedMessages,
                            lastMessage,
                            unreadCount: formattedMessages.filter((m) => !m.read && m.senderId !== userId).length,
                            createdAt: new Date(conv.created_at),
                            updatedAt: new Date(conv.updated_at),
                        };
                    })
                );

                const totalUnread = conversationsWithMessages.reduce((acc, conv) => acc + conv.unreadCount, 0);
                set({ conversations: conversationsWithMessages, unreadCount: totalUnread });
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    sendMessage: async (conversationId, content, senderId, senderName) => {
        try {
            const supabase = getSupabaseClient();

            // Insert message
            const { data: newMsg, error } = await (supabase
                .from('messages') as any)
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    sender_name: senderName,
                    content,
                    read: false,
                })
                .select()
                .single();

            if (error) {
                console.error('Error sending message:', error);
                return;
            }

            // Update conversation's last message and updated_at
            await (supabase
                .from('conversations') as any)
                .update({
                    last_message_id: newMsg.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId);

            // Optimistically update local state
            const newMessage: Message = {
                id: newMsg.id,
                conversationId,
                senderId,
                senderName,
                content,
                timestamp: new Date(newMsg.created_at),
                read: false,
            };

            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId
                        ? {
                            ...conv,
                            messages: [...conv.messages, newMessage],
                            lastMessage: newMessage,
                            updatedAt: new Date(),
                        }
                        : conv
                ),
            }));
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    markAsRead: async (conversationId) => {
        try {
            const supabase = getSupabaseClient();
            const state = get();
            const conv = state.conversations.find((c) => c.id === conversationId);
            if (!conv) return;

            // Update all unread messages in this conversation
            await (supabase
                .from('messages') as any)
                .update({ read: true })
                .eq('conversation_id', conversationId)
                .eq('read', false);

            // Update local state
            set((state) => {
                const unreadInConv = state.conversations.find((c) => c.id === conversationId)?.unreadCount || 0;
                return {
                    conversations: state.conversations.map((conv) =>
                        conv.id === conversationId
                            ? {
                                ...conv,
                                unreadCount: 0,
                                messages: conv.messages.map((msg) => ({ ...msg, read: true })),
                            }
                            : conv
                    ),
                    unreadCount: Math.max(0, state.unreadCount - unreadInConv),
                };
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    },

    createConversation: async (participants, participantNames) => {
        try {
            const supabase = getSupabaseClient();

            // Check if conversation already exists between these participants
            const { data: existing } = await (supabase
                .from('conversations') as any)
                .select('id')
                .contains('participants', participants)
                .single();

            if (existing) {
                return existing.id;
            }

            // Create new conversation
            const { data, error } = await (supabase
                .from('conversations') as any)
                .insert({
                    participants,
                    participant_names: participantNames,
                    unread_count: 0,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating conversation:', error);
                return '';
            }

            const newConversation: Conversation = {
                id: data.id,
                participants,
                participantNames,
                messages: [],
                unreadCount: 0,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            };

            set((state) => ({
                conversations: [newConversation, ...state.conversations],
            }));

            return data.id;
        } catch (error) {
            console.error('Error creating conversation:', error);
            return '';
        }
    },

    getConversation: (id) => {
        return get().conversations.find((conv) => conv.id === id);
    },

    getMessages: (conversationId) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        return conv?.messages || [];
    },

    deleteConversation: async (id) => {
        try {
            const supabase = getSupabaseClient();
            await (supabase.from('conversations') as any).delete().eq('id', id);

            set((state) => ({
                conversations: state.conversations.filter((conv) => conv.id !== id),
                activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
            }));
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    },

    subscribeToMessages: (userId: string) => {
        const supabase = getSupabaseClient();

        const subscription = supabase
            .channel('messages-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMessage = payload.new as any;

                    // Update conversation with new message
                    set((state) => {
                        const updatedConversations = state.conversations.map((conv) => {
                            if (conv.id === newMessage.conversation_id) {
                                const formattedMessage: Message = {
                                    id: newMessage.id,
                                    conversationId: newMessage.conversation_id,
                                    senderId: newMessage.sender_id,
                                    senderName: newMessage.sender_name,
                                    content: newMessage.content,
                                    timestamp: new Date(newMessage.created_at),
                                    read: newMessage.read,
                                };

                                // Don't add duplicate messages
                                if (conv.messages.some((m) => m.id === formattedMessage.id)) {
                                    return conv;
                                }

                                const isUnread = newMessage.sender_id !== userId && !newMessage.read;

                                return {
                                    ...conv,
                                    messages: [...conv.messages, formattedMessage],
                                    lastMessage: formattedMessage,
                                    unreadCount: isUnread ? conv.unreadCount + 1 : conv.unreadCount,
                                    updatedAt: new Date(),
                                };
                            }
                            return conv;
                        });

                        const totalUnread = updatedConversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

                        return {
                            conversations: updatedConversations,
                            unreadCount: totalUnread,
                        };
                    });
                }
            )
            .subscribe();

        // Return unsubscribe function
        return () => {
            supabase.removeChannel(subscription);
        };
    },
}));
