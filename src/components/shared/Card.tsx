'use client';

// ============================================
// DentalHire - Card Component
// ============================================

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className,
            variant = 'default',
            hover = false,
            padding = 'md',
            children,
            ...props
        },
        ref
    ) => {
        const variantStyles = {
            default: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm',
            elevated: 'bg-white dark:bg-gray-800 shadow-lg',
            outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
            gradient: 'bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-100 dark:border-blue-800',
        };

        const paddingStyles = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl transition-all duration-200',
                    variantStyles[variant],
                    paddingStyles[padding],
                    hover && 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header component
interface CardHeaderProps {
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export function CardHeader({ title, subtitle, action, className, children }: CardHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between gap-4', className)}>
            {children || (
                <div>
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1">{subtitle}</p>
                    )}
                </div>
            )}
            {action}
        </div>
    );
}

// Card Content component
interface CardContentProps {
    className?: string;
    children: ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
    return <div className={cn('mt-4', className)}>{children}</div>;
}

// Card Footer component
interface CardFooterProps {
    className?: string;
    children: ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-gray-100 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}

export default Card;
