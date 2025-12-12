'use client';

import { Card, CardHeader, CardContent } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingBag, TrendingUp } from 'lucide-react';

export default function SalesDashboard() {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Sales Opportunities</h3>
                            <p className="text-muted-foreground dark:text-gray-200">Find companies hiring sales reps</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">Performance</h3>
                            <p className="text-muted-foreground dark:text-gray-200">View your application stats</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader title="New Opportunities" />
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-200">
                        No new opportunities found yet.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
