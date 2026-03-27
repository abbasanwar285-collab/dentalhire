import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './db';
import { Capacitor } from '@capacitor/core';

export const NotificationService = {
    // Initialize Listeners and Request Permissions
    init: async () => {
        if (Capacitor.getPlatform() === 'web') {
            console.log('Push Notifications are not supported on web directly without Service Workers.');
            return;
        }

        // 1. Request Permissions
        const permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            const newPerm = await PushNotifications.requestPermissions();
            if (newPerm.receive !== 'granted') {
                return;
            }
        }

        // 2. Register for Push
        await PushNotifications.register();

        // 3. Listeners
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push Registration Token:', token.value);
            await NotificationService.saveToken(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push Registration Error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
            console.log('Push Received:', notification);

            // Trigger a Local Notification to show the alert even if app is open
            await LocalNotifications.schedule({
                notifications: [{
                    title: notification.title || 'New Notification',
                    body: notification.body || '',
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 100) }, // Immediate
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: '',
                    extra: null
                }]
            });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push Action Performed:', notification);
            // Handle navigation here if needed
        });

        // Create Local Notification Channel (Android)
        await LocalNotifications.createChannel({
            id: 'appointments',
            name: 'Appointments',
            description: 'New Appointment Alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
        });
    },

    // Save Token to Supabase
    saveToken: async (token: string) => {
        if (!supabase) return;

        // Check if token exists
        const { data } = await supabase
            .from('notification_tokens')
            .select('id')
            .eq('token', token)
            .single();

        if (!data) {
            await supabase.from('notification_tokens').insert({
                token,
                device_type: Capacitor.getPlatform()
            });
        }
    },

    // Send Local Notification (For the creator)
    sendLocalNotification: async (title: string, body: string) => {
        // Only works on native platforms
        if (Capacitor.getPlatform() === 'web') {
            return;
        }

        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id: new Date().getTime(),
                    schedule: { at: new Date(Date.now() + 100) },
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: '',
                    extra: null,
                    channelId: 'appointments'
                }]
            });
        } catch (e) {
            console.error('[Notification] Failed to send local notification:', e);
        }
    },

    // Send Telegram Notification (Client-Side)
    sendTelegramNotification: async (record: any) => {
        try {
            const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

            if (!botToken || !chatId) {
                console.warn('[Notification] Missing Telegram credentials in .env');
                return;
            }

            const { patientName, date, time, type: treatmentType, doctorId, status } = record;

            // Doctor Badge Mapping
            const doctorNames: Record<string, string> = {
                'dr_abbas': 'د. عباس أنور',
                'dr_ali': 'د. علي رياض',
                'dr_qasim': 'د. قاسم حمودي'
            };
            const doctorDisplay = doctorNames[doctorId] || doctorId || 'غير محدد';

            const escape = (str: any) => str ? str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            // Message Content (Arabic)
            const isArrived = status === 'arrived';
            const title = isArrived ? '🔔 <b>وصول مريض</b>' : '📅 <b>موعد جديد</b>';

            const messageText = `
${title}

👤 <b>المريض:</b> ${escape(patientName)}
🕒 <b>التاريخ:</b> ${escape(date)} - <b>الوقت:</b> ${escape(time)}
👨‍⚕️ <b>الطبيب:</b> ${escape(doctorDisplay)}
🦷 <b>العلاج:</b> ${escape(treatmentType)}
💰 <b>الحالة:</b> ${status === 'arrived' ? 'وصل العيادة (بالانتظار)' : 'مؤكد'}
            `.trim();

            // Send to Telegram API directly
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: messageText,
                    parse_mode: 'HTML'
                })
            });

            const result = await res.json();
            if (result.ok) {
                console.log('[Notification] Telegram sent successfully');
            } else {
                console.error('[Notification] Telegram send failed:', result);
            }

        } catch (e) {
            console.error('[Notification] Telegram Error:', e);
        }
    }
};
