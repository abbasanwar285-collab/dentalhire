'use client';

// ============================================
// DentalHire - Experience Step
// ============================================

import { useEffect, useState } from 'react';
import { useCVStore, useAuthStore } from '@/store';
import { Button, Input } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Experience } from '@/types';
import { Plus, Trash2, Building2, MapPin, Calendar, Edit2, X } from 'lucide-react';

export default function ExperienceStep() {
    const { experience, addExperience, updateExperience, removeExperience } = useCVStore();
    const { user } = useAuthStore();
    const { t, language } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Experience>>({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
    });

    // Auto-fill Job Title based on user role when adding new
    useEffect(() => {
        if (!editingId && !form.title && user?.userType) {
            // Map user types to job titles
            const jobTitles: Record<string, { ar: string, en: string }> = {
                'dentist': { ar: 'طبيب أسنان', en: 'Dentist' },
                'dental_assistant': { ar: 'مساعد طبيب أسنان', en: 'Dental Assistant' },
                'dental_technician': { ar: 'فني أسنان', en: 'Dental Technician' },
                'secretary': { ar: 'سكرتير/ة', en: 'Secretary' },
                'receptionist': { ar: 'موظف استقبال', en: 'Receptionist' },
                'lab_technician': { ar: 'فني مختبر', en: 'Lab Technician' },
            };

            const title = jobTitles[user.userType];
            if (title) {
                setForm(prev => ({
                    ...prev,
                    title: language === 'ar' ? title.ar : title.en
                }));
            }
        }
    }, [user?.userType, language, editingId, form.title]);

    const resetForm = () => {
        setForm({
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title || !form.company || !form.startDate) return;

        if (editingId) {
            updateExperience(editingId, form);
        } else {
            addExperience({
                title: form.title,
                company: form.company,
                location: form.location || '',
                startDate: form.startDate,
                endDate: form.current ? undefined : form.endDate,
                current: form.current || false,
                description: form.description,
            });
        }

        resetForm();
    };

    const handleEdit = (exp: Experience) => {
        setForm(exp);
        setEditingId(exp.id);
        setIsEditing(true);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>{t('common.note')}:</strong> {language === 'ar'
                        ? 'يرجى كتابة خبراتك العملية السابقة في هذا الحقل. اذكر اسم العيادة أو المركز الذي عملت فيه، مع توضيح المهام التي قمت بها.'
                        : 'Please list your previous work experience here. Mention the name of the clinic or center you worked at and describe your responsibilities.'}
                </p>
            </div>

            {/* Experience List */}
            {experience.length > 0 && !isEditing && (
                <div className="space-y-4">
                    {experience.map((exp) => (
                        <div
                            key={exp.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {exp.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <Building2 size={14} />
                                        <span>{exp.company}</span>
                                        {exp.location && (
                                            <>
                                                <span>•</span>
                                                <MapPin size={14} />
                                                <span>{exp.location}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <Calendar size={14} />
                                        <span>
                                            {formatDate(exp.startDate)} - {exp.current ? t('cv.exp.present') : exp.endDate ? formatDate(exp.endDate) : 'N/A'}
                                        </span>
                                        {exp.current && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                                {t('cv.exp.present')}
                                            </span>
                                        )}
                                    </div>
                                    {exp.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                            {exp.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(exp)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        aria-label={t('common.edit')}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeExperience(exp.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        aria-label={t('common.delete')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            {isEditing ? (
                <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            {editingId ? t('cv.exp.edit') : t('cv.exp.addnew')}
                        </h4>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            aria-label={t('common.close')}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={`${t('cv.exp.jobtitle')} *`}
                            placeholder={t('cv.exp.jobtitle.placeholder')}
                            value={form.title || ''}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                        <Input
                            label={`${language === 'ar' ? 'اسم العيادة / المركز' : 'Clinic / Center Name'} *`}
                            placeholder={language === 'ar' ? 'عيادة الابتسامة لطب الأسنان' : 'Smile Dental Clinic'}
                            value={form.company || ''}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                        />
                        <Input
                            label={t('cv.exp.location')}
                            placeholder={language === 'ar' ? 'بغداد، العراق' : 'Baghdad, Iraq'}
                            value={form.location || ''}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                        <div className="flex items-end">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.current || false}
                                    onChange={(e) => setForm({ ...form, current: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{t('cv.exp.current')}</span>
                            </label>
                        </div>
                        <Input
                            label={`${t('cv.exp.startdate')} *`}
                            type="month"
                            value={form.startDate || ''}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                        {!form.current && (
                            <Input
                                label={t('cv.exp.enddate')}
                                type="month"
                                value={form.endDate || ''}
                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            />
                        )}
                    </div>

                    <div>
                        <label htmlFor="exp-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('cv.exp.description')}
                        </label>
                        <textarea
                            id="exp-description"
                            placeholder={t('cv.exp.description.placeholder')}
                            value={form.description || ''}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={resetForm}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                            {editingId ? t('cv.exp.update') : t('cv.exp.addnew')}
                        </Button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    {t('cv.exp.add')}
                </button>
            )}

            {experience.length === 0 && !isEditing && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        <strong>{t('common.note')}:</strong> {t('cv.exp.note')}
                    </p>
                </div>
            )}
        </div>
    );
}

