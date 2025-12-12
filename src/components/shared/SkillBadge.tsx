// ============================================
// DentalHire - Skill Badge Component
// ============================================

import { cn } from '@/lib/utils';

interface SkillBadgeProps {
    skill: string;
    variant?: 'default' | 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md';
    removable?: boolean;
    onRemove?: () => void;
    className?: string;
}

export default function SkillBadge({
    skill,
    variant = 'default',
    size = 'md',
    removable = false,
    onRemove,
    className,
}: SkillBadgeProps) {
    const variantStyles = {
        default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        secondary: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium transition-all',
                variantStyles[variant],
                sizeStyles[size],
                removable && 'pr-1',
                className
            )}
        >
            {skill}
            {removable && onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label={`Remove ${skill}`}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                </button>
            )}
        </span>
    );
}
