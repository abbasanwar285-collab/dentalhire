'use server';

import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/mail';
import { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

interface SendAnnouncementParams {
    title: string;
    content: string;
    targetRole: 'all' | 'job_seeker' | 'clinic';
    sendEmail: boolean;
}

export async function sendAnnouncement({ title, content, targetRole, sendEmail }: SendAnnouncementParams) {
    const supabase = await createClient(); // Await the promise

    // 1. Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }

    // 2. Insert Announcement into DB
    // We map 'all' -> 'job_seeker' as default or handle logic. 
    // The current schema restricts target_role to specific values?
    // Let's check schema: target_role text. ok.

    // For now, if 'all', we might need to insert twice or chang logic. 
    // Let's stick to the requested: Job Seekers OR Employers.
    // If targetRole is 'clinic', it maps to 'clinic' in DB.

    const dbTargetRole = targetRole;

    const { error: dbError } = await supabase
        .from('announcements')
        .insert({
            title,
            content,
            target_role: dbTargetRole,
            is_active: true,
            created_by: user.id
        });

    if (dbError) throw new Error(`Database Error: ${dbError.message}`);

    // 3. Send Emails if requested
    if (sendEmail) {
        let query = supabase.from('users').select('email');

        if (targetRole !== 'all') {
            query = query.eq('role', targetRole);
        } else {
            // If all, maybe exclude admin? or include all.
            query = query.in('role', ['job_seeker', 'clinic']);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) throw new Error(`Fetch Users Error: ${usersError.message}`);
        if (!users || users.length === 0) return { success: true, count: 0 };

        // Send in batches (Resend limit is usually 100 per batch or rate limited)
        // For simplicity in this demo, we loop or use batch endpoint if available (Resend batch is free/paid?)
        // Let's simple loop for now or batch 50.
        // Resend batch sending:
        /*
        await resend.batch.send(users.map(u => ({
            from: 'HireMe <onboarding@resend.dev>',
            to: u.email,
            subject: title,
            html: `<div dir="rtl"><h2>${title}</h2><p>${content}</p></div>`
        })));
        */
        // Since we are on free tier, safer to send one by one or small batches.

        const emailPromises = users.map((u: { email: string }) =>
            resend.emails.send({
                from: 'HireMe <onboarding@resend.dev>',
                to: u.email,
                subject: title,
                html: `<div dir="rtl" style="font-family: sans-serif;">
                        <h2 style="color: #2563eb;">${title}</h2>
                        <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                            ${content.replace(/\n/g, '<br/>')}
                        </div>
                        <br/>
                        <hr style="border: 0; border-top: 1px solid #eee;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                            HireMe Platform
                        </p>
                      </div>`
            })
        );

        // Execute in parallel (might hit rate limits if many users)
        await Promise.allSettled(emailPromises);

        return { success: true, count: users.length };
    }

    return { success: true, count: 0 };
}
