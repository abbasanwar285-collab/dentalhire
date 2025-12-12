'use client';

import { Card, CardHeader, CardContent } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone, Camera } from 'lucide-react';

export default function MediaDashboard() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Brand Campaigns</h3>
                            <p className="text-muted-foreground dark:text-gray-200">Find brands looking for faces</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                            <Camera size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">Portfolio Views</h3>
                            <p className="text-muted-foreground dark:text-gray-200">See who viewed your media kit</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
