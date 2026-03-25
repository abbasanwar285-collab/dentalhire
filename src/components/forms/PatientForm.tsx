import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { validatePhone } from '../../lib/security';
import { haptic } from '../../lib/haptics';
import { User, Phone, Calendar, Stethoscope, FileText, CheckCircle2, AlertCircle, HeartPulse } from 'lucide-react';

interface FormErrors {
    name?: string;
    phone?: string;
    age?: string;
}

interface PatientFormProps {
    onSubmit: (patient: Omit<Patient, 'id'>) => void;
    onCancel: () => void;
    initialData?: Patient;
}

export function PatientForm({ onSubmit, onCancel, initialData }: PatientFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        age: initialData?.age?.toString() || '',
        medicalHistory: initialData?.medicalHistory || '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = useMemo(() => {
        return (name: string, value: string): string | undefined => {
            switch (name) {
                case 'name':
                    if (!value || value.trim().length < 2) {
                        return 'الاسم يجب أن يكون على الأقل حرفين';
                    }
                    if (value.length > 100) {
                        return 'الاسم طويل جداً';
                    }
                    return undefined;
                case 'phone':
                    // Just basic validation if provided length is adequate
                    if (value && value.length < 10) {
                         return 'رقم الهاتف قصير جداً';
                    }
                    return undefined;
                case 'age':
                    if (value && (parseInt(value) < 0 || parseInt(value) > 150)) {
                         return 'العمر غير منطقي';
                    }
                    return undefined;
                default:
                    return undefined;
            }
        };
    }, []);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: FormErrors = {};
        let hasErrors = false;

        const nameError = validateField('name', formData.name);
        if (nameError) {
            newErrors.name = nameError;
            hasErrors = true;
        }

        const phoneError = validateField('phone', formData.phone);
        if (phoneError) {
            newErrors.phone = phoneError;
            hasErrors = true;
        }
        
        const ageError = validateField('age', formData.age);
        if (ageError) {
            newErrors.age = ageError;
            hasErrors = true;
        }

        setErrors(newErrors);
        setTouched({ name: true, phone: true, age: true });

        if (!hasErrors) {
            haptic.success();
            setIsSubmitting(true);
            const submitData = {
                ...formData,
                age: formData.age ? parseInt(formData.age, 10) : undefined,
            };
            
            // Add a slight delay for better UX (feels premium)
            setTimeout(() => {
                onSubmit(submitData as any);
                setIsSubmitting(false);
            }, 300);
            
        } else {
            haptic.error();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    // Count filled fields for progress indicator (only personal info)
    const filledCount = [
        formData.name,
        formData.phone,
        formData.age,
    ].filter(Boolean).length;
    const totalFields = 3;
    const progressPercent = Math.round((filledCount / totalFields) * 100);

    return (
        <form onSubmit={handleSubmit} className="text-right flex flex-col h-full items-stretch animate-in fade-in duration-300" noValidate>
            
            {/* ── Progress Indicator ── */}
            <div className="mb-6 px-1 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-slate-500">اكتمال البيانات</span>
                    <span className="text-[12px] font-extrabold text-teal-600">{progressPercent}%</span>
                </div>
                <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progressPercent}%`,
                            background: progressPercent === 100
                                ? 'linear-gradient(90deg, #10B981, #059669)'
                                : 'linear-gradient(90deg, #2DD4BF, #0F766E)',
                        }}
                    />
                </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-6 px-1 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                
                {/* ── Section 1: Personal Information Card ── */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/80 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                            <User className="w-4 h-4 text-teal-600" />
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-800">المعلومات الشخصية</h3>
                    </div>

                    <div className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-1.5 focus-within:-translate-y-0.5 transition-transform duration-200">
                            <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1">
                                الاسم الكامل <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none">
                                    <User className="w-[18px] h-[18px]" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="أدخل اسم المريض..."
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full bg-slate-50/70 border ${touched.name && errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20'} rounded-2xl pr-11 pl-11 py-3.5 text-[15px] font-semibold text-slate-800 focus:bg-white focus:ring-4 transition-all duration-200 outline-none placeholder:text-slate-400 placeholder:font-normal`}
                                    dir="rtl"
                                    aria-invalid={errors.name ? "true" : undefined}
                                />
                                {touched.name && !errors.name && formData.name.length > 2 && (
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-200 pointer-events-none">
                                        <CheckCircle2 className="w-5 h-5 text-teal-500" />
                                    </div>
                                )}
                                {touched.name && errors.name && (
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-200 pointer-events-none">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                )}
                            </div>
                            {touched.name && errors.name && (
                                <p className="text-[12px] font-medium text-red-500 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-1.5 focus-within:-translate-y-0.5 transition-transform duration-200">
                            <label className="text-[13px] font-bold text-slate-600 flex items-center justify-between">
                                <span>رقم الهاتف</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                    <Phone className="w-[18px] h-[18px]" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    inputMode="numeric"
                                    placeholder="07xxxxxxxxx"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`w-full bg-slate-50/70 border ${touched.phone && errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-2xl pr-11 pl-4 py-3.5 text-[15px] font-semibold text-slate-800 focus:bg-white focus:ring-4 transition-all duration-200 outline-none placeholder:text-slate-400 placeholder:font-normal`}
                                    dir="ltr"
                                />
                            </div>
                            {touched.phone && errors.phone && (
                                <p className="text-[12px] font-medium text-red-500 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* Age Field */}
                        <div className="space-y-1.5 focus-within:-translate-y-0.5 transition-transform duration-200">
                            <label className="text-[13px] font-bold text-slate-600 flex items-center justify-between">
                                <span>العمر</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    name="age"
                                    inputMode="numeric"
                                    placeholder="العمر بالسنوات"
                                    value={formData.age}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    min="0"
                                    max="150"
                                    className={`w-full bg-slate-50/70 border ${touched.age && errors.age ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20'} rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-800 focus:bg-white focus:ring-4 transition-all duration-200 outline-none placeholder:text-slate-400 placeholder:font-normal`}
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Medical Information Card ── */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/80 transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-2.5 mb-5">
                        <h3 className="text-[15px] font-bold text-slate-800">المعلومات الطبية</h3>
                    </div>

                    <div className="space-y-1.5 focus-within:-translate-y-0.5 transition-transform duration-200">
                        <label className="text-[13px] font-bold text-slate-600 flex items-center justify-between">
                            <span>ملاحظات طبية</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute right-3.5 top-4 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none">
                                <FileText className="w-[18px] h-[18px]" />
                            </div>
                            <textarea
                                name="medicalHistory"
                                rows={4}
                                placeholder="الحساسية، الأمراض المزمنة، الأدوية الحالية..."
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                className="w-full bg-slate-50/70 border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 rounded-2xl pr-11 pl-4 py-3.5 text-[14px] font-medium text-slate-700 focus:bg-white transition-all duration-200 outline-none placeholder:text-slate-400 placeholder:font-normal resize-none leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* ── Action Buttons ── */}
            <div className="pt-3 px-1 mt-auto shrink-0 bg-white/50 backdrop-blur-sm relative z-10">
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold text-[16px] shadow-lg shadow-teal-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                        onClick={() => haptic.light()}
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>حفظ المريض</span>
                                <CheckCircle2 className="w-[20px] h-[20px]" />
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            haptic.light();
                            onCancel();
                        }}
                        disabled={isSubmitting}
                        className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-[16px] hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </form>
    );
}
