// ============================================
// DentalHire - Loading Spinner Component
// ============================================

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    const sizeStyles = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
    };

    return (
        <div
            className={cn(
                'rounded-full border-blue-500 border-t-transparent animate-spin',
                sizeStyles[size],
                className
            )}
        />
    );
}

// Full page loading state
export function PageLoader() {
    return (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 dark:text-gray-400 animate-pulse">جاري التحميل...</p>
            </div>
        </div>
    );
}

// Skeleton loader for cards
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full skeleton" />
                <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                    <div className="h-3 w-full skeleton rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 skeleton rounded-full" />
                <div className="h-6 w-16 skeleton rounded-full" />
                <div className="h-6 w-24 skeleton rounded-full" />
            </div>
        </div>
    );
}

// Skeleton loader for table rows
export function TableRowSkeleton() {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-800">
            <td className="py-4 px-4">
                <div className="h-4 w-24 skeleton rounded" />
            </td>
            <td className="py-4 px-4">
                <div className="h-4 w-32 skeleton rounded" />
            </td>
            <td className="py-4 px-4">
                <div className="h-4 w-20 skeleton rounded" />
            </td>
            <td className="py-4 px-4">
                <div className="h-4 w-16 skeleton rounded" />
            </td>
        </tr>
    );
}
