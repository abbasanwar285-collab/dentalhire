import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase';

export type NotificationType = 'status_change' | 'new_application' | 'system';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    related_id?: string;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
    subscribeToNotifications: (userId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async (userId: string) => {
        set({ isLoading: true });
        const supabase = getSupabaseClient();

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const notifications = data as Notification[];
            const unreadCount = notifications.filter(n => !n.read).length;

            set({ notifications, unreadCount, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        const supabase = getSupabaseClient();

        // Optimistic update
        const notifications = get().notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert if needed, but low priority
        }
    },

    markAllAsRead: async (userId: string) => {
        const supabase = getSupabaseClient();

        // Optimistic update
        const notifications = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },

    addNotification: (notification: Notification) => {
        set(state => {
            // Avoid duplicates if already added manually or via race condition
            if (state.notifications.some(n => n.id === notification.id)) return state;

            const newNotifications = [notification, ...state.notifications];
            return {
                notifications: newNotifications,
                unreadCount: state.unreadCount + (notification.read ? 0 : 1)
            };
        });

        // Trigger Browser Notification if supported and permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icons/icon-192x192.png' // Adjust path as needed
            });
        }
    },

    subscribeToNotifications: (userId: string) => {
        const supabase = getSupabaseClient();

        // Request notification permission on subscription start
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const channelName = `notifications-${userId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    console.log('Realtime notification received:', payload);
                    const newNotification = payload.new as Notification;

                    // Client-side filtering
                    if (newNotification.user_id === userId) {
                        get().addNotification(newNotification);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Notification subscription status for ${userId}:`, status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime Connected!');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime Connection Error. Trying to reconnect...');
                    // Optional: You could retry here, but usually Supabase client handles basic retries.
                    // If it persists, it might be the leak issue we are fixing.
                }
            });

        // Return unsubscribe function
        return () => {
            console.log(`Unsubscribing from ${channelName}`);
            supabase.removeChannel(channel);
        };
    }
}));
