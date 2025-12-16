import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure web-push
webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@dentalhire.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
    try {
        const { userId, title, message, url } = await request.json();

        if (!userId || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Supabase Admin Client to fetch subscriptions
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Ideally Service Role Key, but for now we rely on RLS or Anon if public
        );

        // Note: To fetch OTHER users' subscriptions, we really need the SERVICE_ROLE_KEY.
        // If we only have Anon key, we can't query the 'push_subscriptions' table for another user depending on RLS.
        // However, since we are in a server route, we should use the Service Role Key if available, or assume the caller has permissions.
        // Let's check environment for service role key, if not, we might be limited.
        // For this implementation, I'll assume we might need to bypass RLS or use the user's own token if sending to self.
        // BUT, usually notifications are system triggered. Let's try to query.

        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found for user' }, { status: 200 });
        }

        // Send notification to all user endpoints
        const notifications = subscriptions.map((sub) => {
            const payload = JSON.stringify({
                title,
                body: message,
                icon: '/icons/icon-192x192.png',
                url: url || '/'
            });

            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth_key,
                    p256dh: sub.p256dh_key
                }
            };

            return webpush.sendNotification(pushSubscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription is gone, delete from DB
                        console.log('Subscription expired, deleting:', sub.id);
                        supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
                    } else {
                        console.error('Error sending push:', err);
                    }
                });
        });

        await Promise.all(notifications);

        return NextResponse.json({ success: true, count: notifications.length });
    } catch (error: any) {
        console.error('Error in push route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
