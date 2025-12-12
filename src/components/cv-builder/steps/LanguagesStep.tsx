'use client';

// ============================================
// DentalHire - Languages Step
// ============================================

import { useState } from 'react';
import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/shared';
import { LanguageProficiency } from '@/types';
import { Plus, Trash2, Globe } from 'lucide-react';

export default function LanguagesStep() {
    const { languages: userLanguages, addLanguage, removeLanguage, updateLanguage } = useCVStore();
    const { language, t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [newLanguage, setNewLanguage] = useState('');
    const [newProficiency, setNewProficiency] = useState<LanguageProficiency>('intermediate');

    const proficiencyLevels: { value: LanguageProficiency; label: string; labelAr: string; description: string; descriptionAr: string }[] = [
        { value: 'basic', label: 'Basic', labelAr: 'مبتدئ', description: 'Beginner level', descriptionAr: 'مستوى مبتدئ' },
        { value: 'intermediate', label: 'Intermediate', labelAr: 'متوسط', description: 'Conversational', descriptionAr: 'محادثة' },
        { value: 'fluent', label: 'Fluent', labelAr: 'طليق', description: 'Professional level', descriptionAr: 'مستوى احترافي' },
        { value: 'native', label: 'Native', labelAr: 'لغة أم', description: 'Mother tongue', descriptionAr: 'اللغة الأصلية' },
    ];

    const commonLanguages = language === 'ar'
        ? ['العربية', 'الإنجليزية', 'الفرنسية', 'الألمانية', 'الإسبانية', 'التركية', 'الفارسية', 'الكردية', 'الأردية', 'الهندية']
        : ['Arabic', 'English', 'French', 'German', 'Spanish', 'Turkish', 'Persian', 'Kurdish', 'Urdu', 'Hindi'];

    const handleAdd = () => {
        if (newLanguage.trim() && !userLanguages.some(l => l.language === newLanguage.trim())) {
            addLanguage({ language: newLanguage.trim(), proficiency: newProficiency });
            setNewLanguage('');
            setNewProficiency('intermediate');
            setShowForm(false);
        }
    };

    const availableLanguages = commonLanguages.filter(
        lang => !userLanguages.some(l => l.language === lang)
    );

    const getProficiencyLabel = (value: LanguageProficiency) => {
        const level = proficiencyLevels.find(l => l.value === value);
        return language === 'ar' ? level?.labelAr : level?.label;
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar'
                    ? 'أدرج اللغات التي تتحدثها ومستوى إجادتك. هذا مفيد خاصة في المجتمعات المتنوعة.'
                    : 'List the languages you speak and your proficiency level. This is especially valuable in diverse communities.'}
            </p>

            {/* Added Languages */}
            {userLanguages.length > 0 && (
                <div className="space-y-3">
                    {userLanguages.map((lang, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{lang.language}</h4>
                                    <select
                                        value={lang.proficiency}
                                        onChange={(e) => updateLanguage(index, { ...lang, proficiency: e.target.value as LanguageProficiency })}
                                        className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-blue-600"
                                        aria-label={`${language === 'ar' ? 'مستوى الإجادة لـ' : 'Proficiency for'} ${lang.language}`}
                                    >
                                        {proficiencyLevels.map(level => (
                                            <option key={level.value} value={level.value}>
                                                {language === 'ar' ? level.labelAr : level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => removeLanguage(lang.language)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                aria-label={`${language === 'ar' ? 'إزالة' : 'Remove'} ${lang.language}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Language Form */}
            {showForm ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {language === 'ar' ? 'اللغة' : 'Language'}
                            </label>
                            <input
                                type="text"
                                placeholder={language === 'ar' ? 'مثال: الإنجليزية' : 'e.g., Spanish'}
                                value={newLanguage}
                                onChange={(e) => setNewLanguage(e.target.value)}
                                list="languages-list"
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <datalist id="languages-list">
                                {availableLanguages.map(lang => (
                                    <option key={lang} value={lang} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {language === 'ar' ? 'مستوى الإجادة' : 'Proficiency'}
                            </label>
                            <select
                                value={newProficiency}
                                onChange={(e) => setNewProficiency(e.target.value as LanguageProficiency)}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                aria-label={language === 'ar' ? 'مستوى الإجادة' : 'Proficiency level'}
                            >
                                {proficiencyLevels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {language === 'ar' ? `${level.labelAr} - ${level.descriptionAr}` : `${level.label} - ${level.description}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleAdd} disabled={!newLanguage.trim()}>
                            {language === 'ar' ? 'إضافة لغة' : 'Add Language'}
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    {language === 'ar' ? 'إضافة لغة' : 'Add Language'}
                </button>
            )}

            {/* Quick Add Common Languages */}
            {!showForm && availableLanguages.length > 0 && (
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        {language === 'ar' ? 'إضافة سريعة' : 'Quick Add'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableLanguages.slice(0, 8).map(lang => (
                            <button
                                key={lang}
                                onClick={() => addLanguage({ language: lang, proficiency: 'intermediate' })}
                                className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                            >
                                + {lang}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {userLanguages.length === 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>{t('common.note')}:</strong> {language === 'ar' ? 'أضف لغة واحدة على الأقل للمتابعة.' : 'Add at least one language to proceed.'}
                    </p>
                </div>
            )}
        </div>
    );
}
