import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}) => {
    const ActionIcon = action?.icon;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
            <div className="bg-gray-800/40 backdrop-blur-md rounded-full p-6 mb-6 border border-gray-700/50">
                <Icon size={48} className="text-gray-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-300 mb-2">
                {title}
            </h3>

            <p className="text-gray-500 text-sm max-w-sm mb-6">
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    {ActionIcon && <ActionIcon size={20} />}
                    {action.label}
                </button>
            )}
        </div>
    );
};
