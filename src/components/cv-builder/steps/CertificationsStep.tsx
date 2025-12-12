'use client';

// ============================================
// DentalHire - Certifications Step
// ============================================

import { useState } from 'react';
import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button, Input } from '@/components/shared';
import { Certification } from '@/types';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Edit2, X, Award, Building2, Calendar } from 'lucide-react';

export default function CertificationsStep() {
    const { certifications, addCertification, updateCertification, removeCertification } = useCVStore();
    const { language, t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Certification>>({
        name: '',
        issuer: '',
        date: '',
        expiryDate: '',
        credentialId: '',
    });

    const resetForm = () => {
        setForm({ name: '', issuer: '', date: '', expiryDate: '', credentialId: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.issuer || !form.date) return;

        if (editingId) {
            updateCertification(editingId, form);
        } else {
            addCertification({
                name: form.name,
                issuer: form.issuer,
                date: form.date,
                expiryDate: form.expiryDate,
                credentialId: form.credentialId,
            });
        }
        resetForm();
    };

    const handleEdit = (cert: Certification) => {
        setForm(cert);
        setEditingId(cert.id);
        setIsEditing(true);
    };

    const suggestedCertifications = [
        { name: language === 'ar' ? 'مساعد طب أسنان مسجل (RDA)' : 'Registered Dental Assistant (RDA)', issuer: language === 'ar' ? 'مجلس طب الأسنان' : 'State Dental Board' },
        { name: language === 'ar' ? 'مساعد طب أسنان معتمد (CDA)' : 'Certified Dental Assistant (CDA)', issuer: 'DANB' },
        { name: language === 'ar' ? 'شهادة الإنعاش القلبي (CPR/BLS)' : 'CPR/BLS Certification', issuer: language === 'ar' ? 'جمعية القلب الأمريكية' : 'American Heart Association' },
        { name: language === 'ar' ? 'ترخيص الأشعة السينية للأسنان' : 'Dental Radiology License', issuer: language === 'ar' ? 'مجلس طب الأسنان' : 'State Dental Board' },
        { name: language === 'ar' ? 'تدريب السلامة المهنية (OSHA)' : 'OSHA Compliance Training', issuer: 'OSHA' },
        { name: language === 'ar' ? 'شهادة أكسيد النيتروز' : 'Nitrous Oxide Certification', issuer: language === 'ar' ? 'مجلس طب الأسنان' : 'State Dental Board' },
    ];

    const formatDisplayDate = (date: string) => {
        return formatDate(date);
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <p className="text-gray-600 dark:text-gray-400">
                    {language === 'ar'
                        ? 'أضف شهاداتك المهنية وتراخيصك. هذه الخطوة اختيارية ولكن يوصى بها.'
                        : 'Add your professional certifications and licenses. This step is optional but recommended.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {language === 'ar'
                        ? 'الشهادات تساعد في التحقق من مؤهلاتك ويمكن أن تحسن نسبة تطابقك.'
                        : 'Certifications help verify your qualifications and can improve your match score.'}
                </p>
            </div>

            {/* Certifications List */}
            {certifications.length > 0 && !isEditing && (
                <div className="space-y-3">
                    {certifications.map((cert) => (
                        <div
                            key={cert.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 flex items-start justify-between"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{cert.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Building2 size={14} /> {cert.issuer}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {language === 'ar' ? 'صدرت:' : 'Issued:'} {formatDisplayDate(cert.date)}
                                        </span>
                                        {cert.expiryDate && (
                                            <span>{language === 'ar' ? 'تنتهي:' : 'Expires:'} {formatDisplayDate(cert.expiryDate)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(cert)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    aria-label={t('common.edit')}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => removeCertification(cert.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    aria-label={t('common.delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
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
                            {editingId
                                ? (language === 'ar' ? 'تعديل الشهادة' : 'Edit Certification')
                                : (language === 'ar' ? 'إضافة شهادة' : 'Add Certification')}
                        </h4>
                        <button type="button" onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" aria-label={t('common.close')}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={language === 'ar' ? 'اسم الشهادة *' : 'Certification Name *'}
                            placeholder={language === 'ar' ? 'مثال: مساعد طب أسنان مسجل' : 'e.g., Registered Dental Assistant'}
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <Input
                            label={language === 'ar' ? 'الجهة المانحة *' : 'Issuing Organization *'}
                            placeholder={language === 'ar' ? 'مثال: مجلس طب الأسنان' : 'e.g., State Dental Board'}
                            value={form.issuer || ''}
                            onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                        />
                        <Input
                            label={language === 'ar' ? 'تاريخ الإصدار *' : 'Issue Date *'}
                            type="month"
                            value={form.date || ''}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <Input
                            label={language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                            type="month"
                            value={form.expiryDate || ''}
                            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                            helperText={language === 'ar' ? 'اتركه فارغاً إذا لا تنتهي' : "Leave empty if it doesn't expire"}
                        />
                        <Input
                            label={language === 'ar' ? 'رقم الاعتماد' : 'Credential ID'}
                            placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                            value={form.credentialId || ''}
                            onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={resetForm}>{t('common.cancel')}</Button>
                        <Button type="submit">{editingId ? t('cv.exp.update') : (language === 'ar' ? 'إضافة شهادة' : 'Add Certification')}</Button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    {language === 'ar' ? 'إضافة شهادة' : 'Add Certification'}
                </button>
            )}

            {/* Suggested Certifications */}
            {!isEditing && (
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                        {language === 'ar' ? 'شهادات طب الأسنان الشائعة' : 'Common Dental Certifications'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suggestedCertifications.map((cert, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setForm({ name: cert.name, issuer: cert.issuer, date: '', expiryDate: '', credentialId: '' });
                                    setIsEditing(true);
                                }}
                                className="p-3 text-start bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:shadow-sm transition-all"
                            >
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.name}</p>
                                <p className="text-xs text-gray-500">{cert.issuer}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
