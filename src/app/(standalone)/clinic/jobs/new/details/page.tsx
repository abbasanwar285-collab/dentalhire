'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase, DollarSign,
    Check, Sparkles
} from 'lucide-react';
import { Button, Input } from '@/components/shared';
import { useJobCreationStore } from '@/store';

// Dynamic Fields Configuration
const roleSpecificFields: Record<string, { label: string; placeholder: string; type?: string; options?: string[] }[]> = {
    dentist: [
        { label: 'رقم الترخيص', placeholder: 'رقم الترخيص الطبي', type: 'text' },
        { label: 'التخصص الدقيق', placeholder: 'مثال: تقويم، جراحة، أطفال', type: 'text' },
        { label: 'سنوات الخبرة', placeholder: 'عدد السنوات', type: 'select', options: ['0-2', '3-5', '5-10', '10+'] },
    ],
    assistant: [
        { label: 'شهادة مساعد', placeholder: 'هل لديك شهادة معتمدة؟', type: 'select', options: ['نعم', 'لا'] },
        { label: 'مهارات التعقيم', placeholder: 'المستوى في التعقيم', type: 'select', options: ['مبتدئ', 'متوسط', 'خبير'] },
    ],
    sales_rep: [
        { label: 'منطقة التغطية', placeholder: 'المناطق التي تغطيها', type: 'text' },
        { label: 'رخصة قيادة', placeholder: 'هل لديك سيارة؟', type: 'select', options: ['نعم', 'لا'] },
    ],
    technician: [
        { label: 'التخصص', placeholder: 'اختر التخصص', type: 'select', options: ['مصمم (Designer)', 'سيراميست (Ceramist)'] },
        { label: 'سنوات الخبرة', placeholder: 'عدد السنوات', type: 'select', options: ['0-2', '3-5', '5-10', '10+'] },
    ],
};

// AI Suggestion Mock
const getAiSuggestions = (role: string) => {
    const suggestions: Record<string, string[]> = {
        dentist: ['زراعة أسنان', 'فينيير', 'علاج جذور', 'تبييض'],
        assistant: ['تعقيم أدوات', 'تحضير العيادة', 'إدارة مخزون', 'أشعة'],
        sales_rep: ['مهارات تواصل', 'إغلاق صفقات', 'إدارة علاقات عملاء', 'عرض منتجات'],
        technician: ['CAD/CAM', 'تصميم ابتسامة', 'سيراميك', 'Zirconia', 'E-max'],
    };
    return suggestions[role] || [];
};

export default function JobDetailsPage() {
    const router = useRouter();
    const { currentDraftId, selectedRole } = useJobCreationStore();

    // Form State
    const [isLoading, setIsLoading] = useState(false);
    const [dynamicData, setDynamicData] = useState<Record<string, string>>({});
    const [salaryMin, setSalaryMin] = useState(500000);
    const [salaryMax, setSalaryMax] = useState(1500000);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        if (!currentDraftId || !selectedRole) {
            router.push('/clinic/jobs/new');
        }
    }, [currentDraftId, selectedRole, router]);

    const fields = roleSpecificFields[selectedRole || ''] || [];
    const suggestedSkills = getAiSuggestions(selectedRole || '');

    const handleAddSkill = (skill: string) => {
        if (!skills.includes(skill)) setSkills([...skills, skill]);
    };

    const handleSaveDraft = async () => {
        if (!currentDraftId) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/job-draft/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draftId: currentDraftId,
                    stepData: {
                        ...dynamicData,
                        salary: { min: salaryMin, max: salaryMax },
                        skills,
                    },
                    status: 'draft'
                }),
            });

            if (!response.ok) throw new Error('Failed to update draft');
            console.log('Draft updated successfully');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedRole) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20" dir="rtl">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل الوظيفة</h1>
                        <p className="text-sm text-gray-500">لـ: <span className="font-semibold text-blue-600">{selectedRole}</span></p>
                    </div>
                    <div className="text-sm text-gray-400">مسودة محفوظة</div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Dynamic Fields Section */}
                {fields.length > 0 && (
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Briefcase className="text-blue-500" size={20} />
                            متطلبات خاصة بالدور
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {fields.map((field, idx) => (
                                <div key={idx}>
                                    <label htmlFor={`field-${idx}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select
                                            id={`field-${idx}`}
                                            aria-label={field.label}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                                            onChange={(e) => setDynamicData({ ...dynamicData, [field.label]: e.target.value })}
                                        >
                                            <option value="">اختر...</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <Input
                                            id={`field-${idx}`}
                                            placeholder={field.placeholder}
                                            onChange={(e) => setDynamicData({ ...dynamicData, [field.label]: e.target.value })}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills Section with AI Suggestions */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" size={20} />
                        المهارات المطلوبة (مقترحة بالذكاء الاصطناعي)
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedSkills.map(s => (
                            <button
                                key={s}
                                type="button"
                                aria-label={`إضافة مهارة ${s}`}
                                onClick={() => handleAddSkill(s)}
                                className="px-3 py-1 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 rounded-full text-sm hover:bg-purple-100 transition-colors flex items-center gap-1"
                            >
                                <Sparkles size={12} /> {s}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Input
                            placeholder="أضف مهارة أخرى..."
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput) {
                                    handleAddSkill(skillInput);
                                    setSkillInput('');
                                }
                            }}
                        />
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm flex items-center gap-1 animate-in fade-in zoom-in">
                                    {skill}
                                    <button type="button" aria-label={`إزالة ${skill}`} onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-red-500"><Check size={14} className="rotate-45" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Salary Section */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="text-green-500" size={20} />
                        الراتب المتوقع
                    </h2>
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl mb-4">
                        <div className="text-center font-bold text-green-700 dark:text-green-400 text-xl">
                            {(salaryMin / 1000).toFixed(0)}k - {(salaryMax / 1000).toFixed(0)}k IQD
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <label className="sr-only" htmlFor="salary-min">الحد الأدنى للراتب</label>
                        <input
                            id="salary-min"
                            type="range" min="200000" max="5000000" step="100000"
                            value={salaryMin} onChange={(e) => setSalaryMin(parseInt(e.target.value))}
                            className="w-full accent-green-600"
                        />
                        <label className="sr-only" htmlFor="salary-max">الحد الأقصى للراتب</label>
                        <input
                            id="salary-max"
                            type="range" min="200000" max="5000000" step="100000"
                            value={salaryMax} onChange={(e) => setSalaryMax(parseInt(e.target.value))}
                            className="w-full accent-green-600"
                        />
                    </div>
                </section>

            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="ghost" onClick={() => router.push('/clinic/jobs/new')}>رجوع</Button>
                    <Button onClick={handleSaveDraft} loading={isLoading} className="bg-blue-600 text-white px-8">
                        حفظ ومتابعة
                    </Button>
                </div>
            </div>
        </div>
    );
}
