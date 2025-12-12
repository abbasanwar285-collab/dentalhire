'use client';

// ============================================
// DentalHire - Button Component
// ============================================

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            loading = false,
            leftIcon,
            rightIcon,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const variantStyles = {
            primary:
                'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg',
            secondary:
                'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
            outline:
                'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
            ghost:
                'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            danger:
                'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm gap-1.5',
            md: 'px-4 py-2.5 text-sm gap-2',
            lg: 'px-6 py-3 text-base gap-2',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <>
                        <LoadingSpinner size="sm" />
                        <span>Loading...</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
