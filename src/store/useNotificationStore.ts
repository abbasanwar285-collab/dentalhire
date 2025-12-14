import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase';

export type NotificationType =
    | 'job_match'
    | 'nearby_clinic'
    | 'viewed_profile'
    | 'application_status'
    | 'status_change'
    | 'new_application'
    | 'system';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    data?: any;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    lastNotification: Notification | null;

    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
    subscribeToNotifications: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    lastNotification: null,

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

            const notifications = data as any[];
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
            await (supabase
                .from('notifications') as any)
                .update({ read: true })
                .eq('id', id);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllAsRead: async (userId: string) => {
        const supabase = getSupabaseClient();

        const notifications = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });

        try {
            await (supabase
                .from('notifications') as any)
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },

    addNotification: (notification: Notification) => {
        set(state => {
            if (state.notifications.some(n => n.id === notification.id)) return state;

            const newNotifications = [notification, ...state.notifications];
            return {
                notifications: newNotifications,
                unreadCount: state.unreadCount + (notification.read ? 0 : 1),
                lastNotification: notification // Set for Toast
            };
        });

        // Browser Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title || 'New Notification', {
                body: notification.message,
                icon: '/icons/icon-192x192.png'
            });
        }
    },

    subscribeToNotifications: (userId: string) => {
        const supabase = getSupabaseClient();
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
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
                    const newNotification = payload.new as Notification;
                    if (newNotification.user_id === userId) {
                        get().addNotification(newNotification);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}));
