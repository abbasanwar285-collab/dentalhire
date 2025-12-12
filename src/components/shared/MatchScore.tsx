'use client';

// ============================================
// DentalHire - Match Score Ring Component
// ============================================

import { cn, getMatchScoreColor } from '@/lib/utils';

interface MatchScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export default function MatchScore({ score, size = 'md', showLabel = true, className }: MatchScoreProps) {
    const sizeConfig = {
        sm: { width: 40, strokeWidth: 4, fontSize: 'text-xs' },
        md: { width: 60, strokeWidth: 5, fontSize: 'text-sm' },
        lg: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    };

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-[60px] h-[60px]',
        lg: 'w-20 h-20',
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = () => {
        if (score >= 90) return '#10B981';
        if (score >= 75) return '#22C55E';
        if (score >= 60) return '#EAB308';
        if (score >= 40) return '#F97316';
        return '#EF4444';
    };

    return (
        <div className={cn('flex flex-col items-center gap-1', className)}>
            <div className={cn("relative", sizeClasses[size])}>
                <svg
                    width={config.width}
                    height={config.width}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.strokeWidth}
                        className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        stroke={getColor()}
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(config.fontSize, 'font-bold', getMatchScoreColor(score))}>
                        {score}%
                    </span>
                </div>
            </div>
            {showLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Match</span>
            )}
        </div>
    );
}
