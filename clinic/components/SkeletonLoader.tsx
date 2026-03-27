import React from 'react';

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
        </div>
    );
};

export const PatientCardSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-5 border border-gray-700/50 animate-pulse">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="h-5 bg-gray-700/50 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-8 bg-gray-700/50 rounded-full"></div>
            </div>
            <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-700/50 rounded-full w-20"></div>
                <div className="h-6 bg-gray-700/50 rounded-full w-24"></div>
            </div>
        </div>
    );
};

export const ProcedureCardSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-5 border border-gray-700/50 animate-pulse">
            <div className="flex justify-between mb-3">
                <div className="flex-1">
                    <div className="h-5 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                </div>
            </div>
            <div className="bg-gray-700/30 rounded-2xl p-4 mb-3">
                <div className="h-2 bg-gray-700/50 rounded-full w-full mb-2"></div>
                <div className="flex justify-between">
                    <div className="h-3 bg-gray-700/50 rounded w-20"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-20"></div>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 bg-gray-700/50 rounded-xl flex-1"></div>
                <div className="h-10 bg-gray-700/50 rounded-xl w-24"></div>
            </div>
        </div>
    );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-800/40 rounded-xl">
                    <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                </div>
            ))}
        </div>
    );
};

export const ChartSkeleton: React.FC = () => {
    return (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-3xl p-6 border border-gray-700/50 animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-700/30 rounded-2xl flex items-end justify-between p-4 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-700/50 rounded-t w-full"
                        style={{ height: `${Math.random() * 100}%` }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export const PageSkeleton: React.FC = () => {
    return (
        <div className="space-y-4 animate-pulse p-4">
            <div className="h-8 bg-gray-700/50 rounded w-1/3 mb-6"></div>
            <PatientCardSkeleton />
            <PatientCardSkeleton />
            <PatientCardSkeleton />
        </div>
    );
};
