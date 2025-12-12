'use client';

// ============================================
// DentalHire - Skills Step
// ============================================

import { useState } from 'react';
import { useCVStore } from '@/store';
import { Input } from '@/components/shared';
import { SkillBadge } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { dentalSkills, salesSkills } from '@/data/mockData';
import { Search, Plus, Sparkles } from 'lucide-react';

export default function SkillsStep() {
    const { skills, addSkill, removeSkill } = useCVStore();
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [customSkill, setCustomSkill] = useState('');

    const allSuggestions = [...new Set([...dentalSkills, ...salesSkills])];

    const filteredSuggestions = allSuggestions.filter(
        (skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !skills.includes(skill)
    );

    const handleAddCustomSkill = () => {
        if (customSkill.trim() && !skills.includes(customSkill.trim())) {
            addSkill(customSkill.trim());
            setCustomSkill('');
        }
    };

    const popularSkills = [
        'Patient Care',
        'Dental X-rays',
        'Sterilization',
        'Dental Charting',
        'CPR Certified',
        'Infection Control',
        'Patient Education',
        'Dental Software (Dentrix)',
    ];

    const remaining = 3 - skills.length;

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {t('cv.skills.intro')}
            </p>

            {/* Selected Skills */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cv.skills.selected')} ({skills.length})
                </label>
                <div className="min-h-[60px] p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <SkillBadge
                                    key={skill}
                                    skill={skill}
                                    variant="primary"
                                    removable
                                    onRemove={() => removeSkill(skill)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-2">
                            {t('cv.skills.noselected')}
                        </p>
                    )}
                </div>
                {skills.length < 3 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        {t('cv.skills.addmore').replace('{count}', remaining.toString())}
                    </p>
                )}
            </div>

            {/* Search Skills */}
            <div>
                <Input
                    label={t('cv.skills.search')}
                    placeholder={t('cv.skills.searchplaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                />

                {searchTerm && filteredSuggestions.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                        {filteredSuggestions.slice(0, 10).map((skill) => (
                            <button
                                key={skill}
                                onClick={() => {
                                    addSkill(skill);
                                    setSearchTerm('');
                                }}
                                className="w-full px-4 py-2 text-start text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between"
                            >
                                {skill}
                                <Plus size={16} className="text-blue-500" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Custom Skill */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('cv.skills.addcustom')}
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('cv.skills.customplaceholder')}
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                        className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                        onClick={handleAddCustomSkill}
                        disabled={!customSkill.trim()}
                        className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label={t('common.add')}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Popular Skills */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} className="text-blue-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('cv.skills.popular')}
                    </label>
                </div>
                <div className="flex flex-wrap gap-2">
                    {popularSkills.map((skill) => (
                        <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            disabled={skills.includes(skill)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${skills.includes(skill)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 opacity-50 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                                }`}
                        >
                            {skill}
                            {!skills.includes(skill) && <Plus size={14} className="inline ms-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* All Suggestions */}
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t('cv.skills.allavailable')}
                </label>
                <div className="max-h-48 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex flex-wrap gap-2">
                        {allSuggestions.map((skill) => (
                            <button
                                key={skill}
                                onClick={() => addSkill(skill)}
                                disabled={skills.includes(skill)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${skills.includes(skill)
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 shadow-sm'
                                    }`}
                            >
                                {skill}
                                {skills.includes(skill) && ' ✓'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

