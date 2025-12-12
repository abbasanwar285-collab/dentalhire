'use client';

import { Card, CardHeader, CardContent, MatchScore } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Microscope, ClipboardList } from 'lucide-react';

export default function TechnicianDashboard() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Microscope size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Lab Requests</h3>
                            <p className="text-muted-foreground dark:text-gray-200">View potential job matches in labs</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">My Applications</h3>
                            <p className="text-muted-foreground dark:text-gray-200">Track your job applications</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader title="Recommended Labs" />
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-200">
                        Complete your profile to see matched labs.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
