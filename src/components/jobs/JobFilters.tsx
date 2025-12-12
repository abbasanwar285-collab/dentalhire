import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';
import { X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { iraqLocations } from '@/data/iraq_locations';

interface JobFiltersProps {
    className?: string;
    filters: {
        employmentType: string[];
        experienceLevel: string[];
        salaryRange: [number, number];
        location: string[];
        jobRole?: string[]; // Added jobRole
    };
    onFilterChange: (key: string, value: string[] | [number, number]) => void;
    onReset: () => void;
    isOpen: boolean;
    onClose: () => void;
    jobCounts?: {
        employmentType: Record<string, number>;
        location: Record<string, number>;
        jobRole?: Record<string, number>; // Added jobRole counts
    };
}

export default function JobFilters({
    className = '',
    filters,
    onFilterChange,
    onReset,
    isOpen,
    onClose,
    jobCounts
}: JobFiltersProps) {
    const { language } = useLanguage();

    // Accordion states
    const [openSections, setOpenSections] = useState({
        role: true, // Added role section
        type: true,
        experience: true,
        // experience: true, // Removed experience section
        salary: true,
        location: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const employmentTypes = [
        { id: 'full_time', label: { en: 'Full-time', ar: 'دوام كامل' } },
        { id: 'part_time', label: { en: 'Part-time', ar: 'دوام جزئي' } },
        { id: 'contract', label: { en: 'Contract', ar: 'عقد' } },
        { id: 'temporary', label: { en: 'Temporary', ar: 'مؤقت' } },
    ];

    const locations = [
        ...Object.entries(iraqLocations).map(([key, value]) => ({
            id: key.toLowerCase(),
            label: {
                en: value.en || key,
                ar: value.ar
            }
        })),
        { id: 'remote', label: { en: 'Remote', ar: 'عن بعد' } },
    ];

    const handleTypeChange = (typeId: string) => {
        const current = filters.employmentType;
        const updated = current.includes(typeId)
            ? current.filter(t => t !== typeId)
            : [...current, typeId];
        onFilterChange('employmentType', updated);
    };

    const handleLocationChange = (locId: string) => {
        const current = filters.location;
        const updated = current.includes(locId)
            ? current.filter(l => l !== locId)
            : [...current, locId];
        onFilterChange('location', updated);
    };

    const activeFiltersCount =
        filters.employmentType.length +
        filters.experienceLevel.length +
        filters.location.length +
        (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200000 ? 1 : 0);

    // Job Roles Data
    const jobRoles = [
        { id: 'dentist', label: { en: 'General Dentist', ar: 'طبيب أسنان عام' } },
        { id: 'orthodontist', label: { en: 'Orthodontist', ar: 'طبيب تقويم' } },
        { id: 'endodontist', label: { en: 'Endodontist', ar: 'طبيب حشوات وجذور' } },
        { id: 'surgeon', label: { en: 'Oral Surgeon', ar: 'جراح وجه وفكين' } },
        { id: 'pedodontist', label: { en: 'Pedodontist', ar: 'طبيب أسنان أطفال' } },
        { id: 'prosthodontist', label: { en: 'Prosthodontist', ar: 'طبيب تركيبات' } },
        { id: 'assistant', label: { en: 'Dental Assistant', ar: 'مساعد طبيب' } },
        { id: 'nurse', label: { en: 'Nurse', ar: 'ممرض/ة' } },
        { id: 'technician', label: { en: 'Dental Technician', ar: 'تقني أسنان' } },
        { id: 'ceramist', label: { en: 'Ceramist', ar: 'سيراميست' } },
        { id: 'secretary', label: { en: 'Secretary/Reception', ar: 'سكرتير/استقبال' } },
        { id: 'manager', label: { en: 'Clinic Manager', ar: 'مدير عيادة' } },
        { id: 'cleaner', label: { en: 'Cleaner/Service', ar: 'عامل خدمات/نظافة' } },
        { id: 'advertising', label: { en: 'Marketing/Ads', ar: 'تسويق/إعلان' } },
        { id: 'representative', label: { en: 'Sales Representative', ar: 'مندوب مبيعات' } },
    ];

    const handleRoleChange = (roleId: string) => {
        const current = filters.jobRole || [];
        const updated = current.includes(roleId)
            ? current.filter(r => r !== roleId)
            : [...current, roleId];
        onFilterChange('jobRole', updated);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Filter Drawer/Sidebar */}
            <div className={`
                fixed inset-y-0 right-0 z-50 w-full md:w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : (language === 'ar' ? '-translate-x-full' : 'translate-x-full')}
                md:relative md:transform-none md:w-full md:block md:shadow-none md:bg-transparent
                ${className}
            `}>
                <div className="flex flex-col h-full md:h-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {language === 'ar' ? 'تصفية النتائج' : 'Filters'}
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </h2>
                        <button onClick={onClose} aria-label="إغلاق" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* Job Role Section (New) */}
                        <div className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
                            <button
                                onClick={() => toggleSection('role')}
                                className="flex items-center justify-between w-full mb-3 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                {language === 'ar' ? 'المسمى الوظيفي' : 'Job Role'}
                                {openSections.role ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {openSections.role && (
                                <div className="space-y-2">
                                    {jobRoles.map(role => {
                                        const count = jobCounts?.jobRole?.[role.id] || 0;
                                        if (count === 0) return null; // Hide if available jobs is 0

                                        return (
                                            <label key={role.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${(filters.jobRole || []).includes(role.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}
                                                `}>
                                                    {(filters.jobRole || []).includes(role.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={(filters.jobRole || []).includes(role.id)}
                                                    onChange={() => handleRoleChange(role.id)}
                                                />
                                                <div className="flex-1 flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                                        {language === 'ar' ? role.label.ar : role.label.en}
                                                    </span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Job (Employment) Type Section */}
                        <div className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
                            <button
                                onClick={() => toggleSection('type')}
                                className="flex items-center justify-between w-full mb-3 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                {language === 'ar' ? 'نوع الدوام' : 'Employment Type'}
                                {openSections.type ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {openSections.type && (
                                <div className="space-y-2">
                                    {employmentTypes.map(type => {
                                        const count = jobCounts?.employmentType?.[type.id] || 0;
                                        if (count === 0) return null;

                                        return (
                                            <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${filters.employmentType.includes(type.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}
                                                `}>
                                                    {filters.employmentType.includes(type.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={filters.employmentType.includes(type.id)}
                                                    onChange={() => handleTypeChange(type.id)}
                                                />
                                                <div className="flex-1 flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                                        {language === 'ar' ? type.label.ar : type.label.en}
                                                    </span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Location Section */}
                        <div className="border-b border-gray-100 dark:border-gray-700/50 pb-4">
                            <button
                                onClick={() => toggleSection('location')}
                                className="flex items-center justify-between w-full mb-3 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                {language === 'ar' ? 'الموقع' : 'Location'}
                                {openSections.location ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {openSections.location && (
                                <div className="space-y-2">
                                    {locations.map(loc => {
                                        const count = jobCounts?.location?.[loc.id] || 0;
                                        if (count === 0) return null;

                                        return (
                                            <label key={loc.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${filters.location.includes(loc.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}
                                                `}>
                                                    {filters.location.includes(loc.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={filters.location.includes(loc.id)}
                                                    onChange={() => handleLocationChange(loc.id)}
                                                />
                                                <div className="flex-1 flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                                        {language === 'ar' ? loc.label.ar : loc.label.en}
                                                    </span>
                                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                                        {count}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto md:mt-0">
                        <Button
                            variant="primary"
                            className="w-full mb-2"
                            onClick={onClose}
                        >
                            {language === 'ar' ? `عرض النتائج` : `Show Results`}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={onReset}
                        >
                            {language === 'ar' ? 'مسح الكل' : 'Clear All Filters'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
