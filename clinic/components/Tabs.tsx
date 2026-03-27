import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
    id: string;
    label: string;
    icon?: LucideIcon;
}

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
    return (
        <div className={`flex bg-gray-800/60 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-700 overflow-x-auto ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap ${isActive
                                ? 'bg-violet-600 text-white shadow-md scale-[1.02]'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                            }`}
                    >
                        {Icon && <Icon size={18} />}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
