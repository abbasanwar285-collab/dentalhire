export default function JobSkeletons() {
    return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        <div className="flex-1">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                            <div className="flex gap-2">
                                <div className="h-6 bg-gray-100 dark:bg-gray-700/50 rounded w-20" />
                                <div className="h-6 bg-gray-100 dark:bg-gray-700/50 rounded w-24" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function JobDetailSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 h-full animate-pulse">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-50 dark:bg-gray-700/50 rounded-xl" />
                ))}
            </div>

            <div className="space-y-4 mb-8">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-3/4" />
                </div>
            </div>
        </div>
    );
}
