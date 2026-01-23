'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatItem {
    label: string;
    value: string;
    icon: React.ReactNode;
    change: string;
    changeType: 'positive' | 'negative';
    color: string;
}

interface MobileStatsCarouselProps {
    stats: StatItem[];
}

export default function MobileStatsCarousel({ stats }: MobileStatsCarouselProps) {
    const { t } = useLanguage();

    return (
        <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory hide-scrollbar">
            <div className="flex gap-3 w-max">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="snap-center bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[280px] w-[85vw] max-w-[320px] flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-100 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400`}>
                                {stat.icon}
                            </div>
                        </div>

                        <div className={`flex items-center gap-1.5 text-sm font-medium ${stat.changeType === 'positive'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                            {stat.changeType === 'positive'
                                ? <TrendingUp size={16} />
                                : <TrendingDown size={16} />
                            }
                            <span>{stat.change}</span>
                            <span className="text-gray-400 dark:text-gray-500 font-normal">
                                {t('admin.thismonth')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
