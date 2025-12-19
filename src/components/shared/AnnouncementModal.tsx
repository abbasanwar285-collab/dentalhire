'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { getSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/shared';
import { X, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AnnouncementModal() {
    const { user } = useAuthStore();
    const { language } = useLanguage();
    const [announcement, setAnnouncement] = useState<{ id: string; title: string; content: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkAnnouncements = async () => {
            // Only for job seekers currently, as per requirement
            if (!user) return;

            const supabase = getSupabaseClient();

            // 1. Fetch active announcements
            const { data, error } = await supabase
                .from('announcements')
                .select('id, title, content')
                .eq('is_active', true)
                .or(`target_role.eq.${user.role},target_role.eq.all`)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error || !data || (data as any[]).length === 0) return;

            const announcements = data as any[];
            const latestAnnouncement = announcements[0];

            // 2. Check if already read (in localStorage to avoid DB spam on every load)
            const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
            if (readAnnouncements.includes(latestAnnouncement.id)) {
                return;
            }

            // 3. Check DB read status (fallback/cross-device)
            const { data: readEntry } = await supabase
                .from('announcement_reads')
                .select('id')
                .eq('announcement_id', latestAnnouncement.id)
                .eq('user_id', user.id)
                .single();

            if (!readEntry) {
                setAnnouncement(latestAnnouncement);
                setIsOpen(true);
            }
        };

        checkAnnouncements();
    }, [user]);

    const handleDismiss = async () => {
        if (!announcement || !user) return;

        setIsOpen(false);

        // Save to LocalStorage
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        localStorage.setItem('readAnnouncements', JSON.stringify([...readAnnouncements, announcement.id]));

        // Save to DB
        // Save to DB
        const supabase = getSupabaseClient();
        await (supabase.from('announcement_reads') as any).insert({
            announcement_id: announcement.id,
            user_id: user.id
        }).catch((err: any) => console.error('Failed to mark read', err));
    };

    if (!isOpen || !announcement) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-scale-in"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 end-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <Bell size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold">{announcement.title}</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {announcement.content}
                    </p>

                    <div className="mt-8 flex justify-end">
                        <Button
                            onClick={handleDismiss}
                            className="px-8"
                        >
                            {language === 'ar' ? 'حسناً، فهمت' : 'Main_GotIt'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
