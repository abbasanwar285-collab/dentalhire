import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

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
    enablePushNotifications: (userId: string) => Promise<boolean>;
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
            // Use RPC V2 with explicit parameter
            // @ts-ignore - Types not generated for new RPC yet
            const { data, error } = await supabase
                .rpc('get_my_notifications_v2', { p_user_id: userId });

            if (error) {
                console.error('RPC V2 fetch failed:', error);
                // Fallback attempt (classic select)
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (fallbackError) throw fallbackError;

                const notifications = fallbackData as any[];
                const unreadCount = notifications.filter(n => !n.read).length;
                set({ notifications, unreadCount, isLoading: false });
                return;
            }

            const notifications = data as any[];
            const unreadCount = notifications.filter(n => !n.read).length;

            set({ notifications, unreadCount, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        const supabase = getSupabaseClient();
        const { user } = useAuthStore.getState(); // Get current user for security check

        // Optimistic update
        const notifications = get().notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });

        try {
            if (user?.id) {
                // Use Reliable RPC
                // @ts-ignore
                const { error } = await supabase.rpc('mark_notification_read_v2', {
                    p_notification_id: id,
                    p_user_id: user.id
                });
                if (error) throw error;
            } else {
                // Fallback (unlikely to work if RLS is broken, but standard)
                await (supabase.from('notifications') as any)
                    .update({ read: true })
                    .eq('id', id);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Revert optimistic update on error?? No, keep it for UX, it will sync next fetch.
        }
    },

    markAllAsRead: async (userId: string) => {
        const supabase = getSupabaseClient();

        const notifications = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });

        try {
            // Use Reliable RPC
            // @ts-ignore
            const { error } = await supabase.rpc('mark_all_notifications_read_v2', {
                p_user_id: userId
            });

            if (error) {
                // Fallback
                await (supabase.from('notifications') as any)
                    .update({ read: true })
                    .eq('user_id', userId)
                    .eq('read', false);
            }

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
    },

    enablePushNotifications: async (userId: string) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return false;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim())
            });

            // Save subscription to DB
            const supabase = getSupabaseClient();
            // @ts-ignore - Table not yet in types
            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                auth_key: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth') as ArrayBuffer) as any)),
                p256dh_key: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer) as any))
            } as any, { onConflict: 'endpoint' });

            if (error) console.error('Error saving subscription:', error);

            return true;
        } catch (error) {
            console.error('Error enabling push:', error);
            return false;
        }
    }
}));

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
