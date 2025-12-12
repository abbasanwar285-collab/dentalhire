import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';
import { SearchX, Bell } from 'lucide-react';

interface JobEmptyStateProps {
    onReset: () => void;
}

export default function JobEmptyState({ onReset }: JobEmptyStateProps) {
    const { language } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                <SearchX size={40} className="text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'ar' ? 'لم يتم العثور على وظائف مطابقة' : 'No matching jobs found'}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
                {language === 'ar'
                    ? 'جرب ضبط الفلاتر الخاصة بك أو تحقق من الإملاء. قد تكون هناك فرص جديدة قريباً.'
                    : 'Try adjusting your filters or check for spelling. New opportunities might be available soon.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    variant="outline"
                    onClick={onReset}
                    className="w-full sm:w-auto"
                >
                    {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                </Button>

                <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                    leftIcon={<Bell size={18} />}
                >
                    {language === 'ar' ? 'تفعيل تنبيهات الوظائف' : 'Create Job Alert'}
                </Button>
            </div>
        </div>
    );
}
