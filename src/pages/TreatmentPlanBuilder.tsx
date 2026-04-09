import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinic } from '../context/ClinicContext';
import { ChevronRight, Plus, FileText, Paperclip, CalendarClock, DollarSign, X, Check, Activity } from 'lucide-react';
import { DentalChart } from '../components/ui/DentalChart';
import { Modal } from '../components/ui/Modal';
import { toothTreatmentsList } from '../lib/data';
import { haptic } from '../lib/haptics';
import { ToothTreatment, TreatmentStep, PaymentRecord, OrthoDetails } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

export function TreatmentPlanBuilder() {
    const { id, planId } = useParams<{ id: string; planId?: string }>();
    const navigate = useNavigate();
    const { patients, doctors, addTreatmentPlan, updateTreatmentPlan } = useClinic();
    const { currentUser } = useAuth();

    const patient = patients.find(p => p.id === id);
    const existingPlan = planId ? patient?.treatmentPlans?.find(p => p.id === planId) : null;

    // Auto-fill doctor: match logged-in user to a doctor
    const getDefaultDoctorId = () => {
        if (existingPlan?.doctorId) return existingPlan.doctorId;
        const userName = currentUser?.displayName?.replace('د. ', '').replace('د.', '').trim().toLowerCase() || '';
        const matched = doctors.find(d => d.name.replace('د. ', '').replace('د.', '').trim().toLowerCase() === userName);
        return matched?.id || doctors[0]?.id || '';
    };

    const [treatments, setTreatments] = useState<ToothTreatment[]>(existingPlan?.treatments || []);
    const [payments, setPayments] = useState<PaymentRecord[]>(existingPlan?.payments || []);
    const [notes, setNotes] = useState(existingPlan?.notes || '');
    const [selectedDoctorId, setSelectedDoctorId] = useState(getDefaultDoctorId());
    const [manualCost, setManualCost] = useState(existingPlan ? existingPlan.totalCost.toString() : '');
    const [attachments, setAttachments] = useState<{ id: string; name: string; type: string; url: string }[]>(existingPlan?.attachments || []);

    // Treatment selection state (Select treatment first, then tooth)
    const [selectedTreatmentType, setSelectedTreatmentType] = useState<typeof toothTreatmentsList[0] | null>(
        existingPlan?.orthoDetails ? toothTreatmentsList.find(t => t.name === 'تقويم أسنان (Orthodontics)') || null : null
    );
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
    const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Orthodontics specific state
    const [treatedJaw, setTreatedJaw] = useState<'Upper' | 'Lower' | 'Both'>(existingPlan?.orthoDetails?.treatedJaw || 'Both');
    const [applianceType, setApplianceType] = useState<'Fixed Metal' | 'Clear' | 'Removable'>(existingPlan?.orthoDetails?.applianceType || 'Fixed Metal');
    const [caseType, setCaseType] = useState<'Extraction Case' | 'Non-Extraction Case'>(existingPlan?.orthoDetails?.caseType || 'Non-Extraction Case');
    const [expansion, setExpansion] = useState<boolean>(existingPlan?.orthoDetails?.expansion || false);
    const [diagnosis, setDiagnosis] = useState<string>(existingPlan?.orthoDetails?.diagnosis || 'Class I');

    // Crown selection state
    const [crownModalData, setCrownModalData] = useState<{ tooth: number } | null>(null);

    const isOrtho = selectedTreatmentType?.name === 'تقويم أسنان (Orthodontics)';

    // Initialize data when existingPlan loads (since patients data might be async)
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (existingPlan && !hasInitialized) {
            setTreatments(existingPlan.treatments || []);
            setPayments(existingPlan.payments || []);
            setNotes(existingPlan.notes || '');
            if (existingPlan.doctorId) setSelectedDoctorId(existingPlan.doctorId);
            
            const initComputedCost = (existingPlan.totalCost || 0) > 0 ? existingPlan.totalCost : (existingPlan.treatments?.reduce((sum: number, t: any) => sum + (Number(t.cost || t.price) || 0), 0) || 0);
            setManualCost(initComputedCost ? initComputedCost.toString() : '');
            
            setAttachments(existingPlan.attachments || []);
            
            if (existingPlan.orthoDetails) {
                setSelectedTreatmentType(toothTreatmentsList.find(t => t.name === 'تقويم أسنان (Orthodontics)') || null);
                setTreatedJaw(existingPlan.orthoDetails.treatedJaw || 'Both');
                setApplianceType(existingPlan.orthoDetails.applianceType || 'Fixed Metal');
                setCaseType(existingPlan.orthoDetails.caseType || 'Non-Extraction Case');
                setExpansion(existingPlan.orthoDetails.expansion || false);
                setDiagnosis(existingPlan.orthoDetails.diagnosis || 'Class I');
            } else if (existingPlan.treatments && existingPlan.treatments.length > 0) {
                // Find the existing treatment type in our list to pre-select it
                const firstTypeName = existingPlan.treatments[0].treatmentType;
                // We do a loose match because the saved name might have material appended (e.g. 'Crown - Zircon')
                const matchedType = toothTreatmentsList.find(t => firstTypeName.includes(t.name)) || toothTreatmentsList.find(t => t.name === firstTypeName);
                if (matchedType) setSelectedTreatmentType(matchedType);
            }
            
            setHasInitialized(true);
        }
    }, [existingPlan, hasInitialized]);

    // Auto-select orthodontist
    useEffect(() => {
        if (isOrtho && !existingPlan) {
            const orthoDoctor = doctors.find(d => d.specialization.includes('تقويم') || d.specialization.toLowerCase().includes('ortho'));
            if (orthoDoctor) {
                setSelectedDoctorId(orthoDoctor.id);
            }
        }
    }, [isOrtho, doctors, existingPlan]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!patient) return null;

    const totalCost = manualCost ? parseFloat(manualCost) || 0 : 0;
    const computedPaidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || Number((p as any).payment) || 0), 0);
    const paidAmount = (existingPlan?.paidAmount || 0) > 0 ? existingPlan?.paidAmount : computedPaidAmount;
    const remainingParams = totalCost - paidAmount;

    const handleToothClick = (tooth: number) => {
        if (!selectedTreatmentType) {
            alert('الرجاء تحديد نوع العلاج أولاً');
            return;
        }

        // Check if this tooth already has this treatment
        const alreadyAdded = treatments.some(
            t => t.toothNumber === tooth && t.treatmentType.startsWith(selectedTreatmentType.name)
        );

        if (alreadyAdded) {
            // Optional: Toggle off if clicked again
            setTreatments(prev => prev.filter(t => !(t.toothNumber === tooth && t.treatmentType.startsWith(selectedTreatmentType.name))));
            return;
        }

        const isCrown = selectedTreatmentType.name.includes('Crown') || selectedTreatmentType.name.includes('تلبيسة') || selectedTreatmentType.name.includes('تاج');

        if (isCrown) {
            setCrownModalData({ tooth });
            return;
        }

        const newTreatment: ToothTreatment = {
            id: Math.random().toString(36).substr(2, 9),
            toothNumber: tooth,
            treatmentType: selectedTreatmentType.name,
            cost: 0,
            doctorId: selectedDoctorId
        };

        setTreatments(prev => [...prev, newTreatment]);
    };

    const handleCrownMaterialSelect = (material: string) => {
        if (!crownModalData || !selectedTreatmentType) return;
        const newTreatment: ToothTreatment = {
            id: Math.random().toString(36).substr(2, 9),
            toothNumber: crownModalData.tooth,
            treatmentType: `${selectedTreatmentType.name} - ${material}`,
            cost: 0,
            doctorId: selectedDoctorId
        };
        setTreatments(prev => [...prev, newTreatment]);
        setCrownModalData(null);
    };

    const handleRemoveTreatment = (treatmentId: string) => {
        setTreatments(prev => prev.filter(t => t.id !== treatmentId));
    };

    const handleAddWholeMouthTreatment = (jaw: 'Upper' | 'Lower' | 'Both') => {
        if (!selectedTreatmentType) return;

        haptic.light();

        let num = 0;
        if (jaw === 'Upper') num = 100;
        if (jaw === 'Lower') num = 200;

        // Prevent adding if already added
        const alreadyAdded = treatments.some(
            t => t.toothNumber === num && t.treatmentType === selectedTreatmentType.name
        );

        if (alreadyAdded) return;

        const newTreatment: ToothTreatment = {
            id: Math.random().toString(36).substr(2, 9),
            toothNumber: num,
            treatmentType: selectedTreatmentType.name,
            cost: 0,
            doctorId: selectedDoctorId
        };

        setTreatments(prev => [...prev, newTreatment]);
    };

    const handleSavePlan = () => {
        if (!isOrtho && treatments.length === 0) {
            alert('يجب إضافة معالجة واحدة على الأقل');
            return;
        }

        const autoPlanName = isOrtho ? 'خطة تقويم الأسنان' : (existingPlan?.name || treatments[0]?.treatmentType || 'خطة علاجية');

        const orthoDetails: OrthoDetails | undefined = isOrtho ? {
            treatedJaw,
            applianceType,
            caseType,
            expansion,
            diagnosis
        } : undefined;

        const selectedDoctorName = doctors.find(d => d.id === selectedDoctorId)?.name;

        const planData = {
            patientId: patient.id,
            name: autoPlanName,
            totalCost,
            paidAmount,
            status: existingPlan ? existingPlan.status : 'planned',
            treatments: isOrtho ? existingPlan?.treatments || [] : treatments,
            steps: existingPlan ? existingPlan.steps : [],
            payments,
            attachments,
            notes,
            orthoDetails,
            doctorId: selectedDoctorId,
            doctorName: selectedDoctorName
        };

        if (existingPlan && planId) {
            updateTreatmentPlan(patient.id, planId, planData);
        } else {
            addTreatmentPlan(patient.id, planData);
        }

        navigate(`/patients/${patient.id}#latest-plan`);
    };

    return (
        <div className="min-h-screen bg-apple-bg text-right font-sans pb-24" dir="rtl">
            {/* ── Header ── */}
            <header className="sticky top-0 z-30 bg-apple-bg/80 backdrop-blur-xl border-b border-apple-separator px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex flex-1 items-center gap-1 text-[#0071E3] active:opacity-70 transition-opacity"
                >
                    <ChevronRight className="w-6 h-6" />
                    <span className="text-[17px]">إلغاء</span>
                </button>
                <h1 className="text-[17px] font-semibold text-apple-text flex-1 text-center">{existingPlan ? 'تعديل خطة العلاج' : 'إضافة خطة علاج'}</h1>
                <div className="flex-1" />
            </header>

            <main className="p-4 space-y-3">

                {/* ── Treatment Type Selector (Modal Trigger) ── */}
                <section className="bg-apple-card rounded-2xl border-2 border-[#0071E3]/20 shadow-sm overflow-hidden animate-slide-up p-3">
                    <label className="text-[13px] font-bold text-[#0071E3] mb-1.5 block">إضافة معالجة جديدة للأسنان</label>
                    <button
                        onClick={() => setIsTreatmentModalOpen(true)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-1.5 transition-all text-right ${
                            selectedTreatmentType
                                ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0056B3]'
                                : 'border-apple-separator bg-apple-card hover:bg-apple-fill text-apple-text-secondary'
                        }`}
                    >
                        {selectedTreatmentType ? (
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: selectedTreatmentType.color } as React.CSSProperties}
                                />
                                <span className="text-[16px] font-bold">{selectedTreatmentType.name}</span>
                            </div>
                        ) : (
                            <span className="text-[16px] font-semibold">اختر المعالجة...</span>
                        )}
                        <ChevronRight className="w-5 h-5 opacity-50 rotate-90" />
                    </button>
                </section>

                {/* ── Dental Chart / Whole Mouth Action ── */}
                {!isOrtho && (
                    <section className={`bg-[#0071E3]/[0.04] rounded-2xl border-2 shadow-sm overflow-hidden animate-slide-up transition-colors duration-300 ${selectedTreatmentType ? 'border-[#0071E3]' : 'border-[#0071E3]/20'}`}>
                        {['إزالة التكلسات (Deep Cleaning)', 'تبييض الأسنان (Teeth Whitening)', 'تنظيف الأسنان (Scaling)', 'Full Mouth Rehabilitation'].includes(selectedTreatmentType?.name || '') ? (
                            <div className="bg-white p-4">
                                <div className="flex flex-col items-center justify-center text-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#0071E3]/10 flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-[#0071E3]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0056B3] text-sm">علاج عام (الفم كامل)</h3>
                                        <p className="text-xs text-[#0071E3]/70 mt-1">هذا العلاج لا يطبق على سن محدد بل على الفم بشكل عام.</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'الفك العلوي', value: 'Upper', num: 100 },
                                        { label: 'الفك السفلي', value: 'Lower', num: 200 },
                                        { label: 'الفكين معاً', value: 'Both', num: 0 },
                                    ].map(opt => {
                                        const isAdded = treatments.some(t => t.toothNumber === opt.num && t.treatmentType === selectedTreatmentType?.name);
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleAddWholeMouthTreatment(opt.value as any)}
                                                disabled={isAdded}
                                                className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${
                                                    isAdded 
                                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none' 
                                                    : 'bg-[#0071E3] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                                                }`}
                                            >
                                                {isAdded ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        تم إضافة ({opt.label})
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4" />
                                                        إضافة لـ {opt.label}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 bg-[#0071E3]/[0.08] border-b border-[#0071E3]/10">
                                    <h2 className="text-[15px] font-bold text-[#0056B3]">مخطط الأسنان</h2>
                                    <p className={`text-[12px] mt-0.5 font-medium ${selectedTreatmentType ? 'text-[#0071E3]' : 'text-[#0071E3]/50'}`}>
                                        {selectedTreatmentType ? `اضغط على السن لتطبيق "${selectedTreatmentType.name}" (اضغط مجدداً للإزالة)` : 'الرجاء تحديد نوع العلاج أولاً من الأعلى'}
                                    </p>
                                </div>
                                <div className={`p-2 transition-opacity duration-300 ${!selectedTreatmentType ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    <DentalChart
                                        treatments={treatments}
                                        onToothClick={handleToothClick}
                                        selectedTooth={null}
                                    />
                                </div>
                            </>
                        )}
                    </section>
                )}

                {/* ── Chosen Treatments List ── */}
                {!isOrtho && treatments.length > 0 && (
                    <section className="bg-apple-card rounded-2xl border-2 border-[#8E8E93]/20 shadow-sm overflow-hidden animate-slide-up">
                        <div className="p-3 bg-apple-bg border-b border-[#8E8E93]/10">
                            <h2 className="text-[15px] font-bold text-apple-text">المعالجات المضافة</h2>
                        </div>
                        <div className="p-2 space-y-1">
                            {treatments.map((t) => {
                                const tListColor = toothTreatmentsList.find(x => x.name === t.treatmentType)?.color || '#0071E3';
                                return (
                                    <div key={t.id} className="flex items-center p-2 rounded-lg bg-apple-fill justify-between group">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className={`h-8 rounded-full text-white flex items-center justify-center font-bold shrink-0 ${[0, 100, 200].includes(t.toothNumber) ? 'px-3 text-[11px]' : 'w-8 text-[13px]'}`}
                                                style={{ backgroundColor: tListColor } as React.CSSProperties}
                                            >
                                                {t.toothNumber === 0 ? 'عام' : t.toothNumber === 100 ? 'علوي' : t.toothNumber === 200 ? 'سفلي' : t.toothNumber}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[14px] font-semibold text-apple-text truncate">{t.treatmentType}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveTreatment(t.id)}
                                            className="w-6 h-6 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center opacity-70 hover:opacity-100 active:scale-90 transition-all shrink-0"
                                            aria-label="حذف المعالجة"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── Orthodontics Specific UI ── */}
                {isOrtho && (
                    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. Treated Jaw */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <label className="text-[14px] font-bold text-slate-700">الفك المعالج</label>
                            </div>
                            <div className="p-3 flex gap-2">
                                {[
                                    { label: 'الفك العلوي', value: 'Upper' },
                                    { label: 'الفك السفلي', value: 'Lower' },
                                    { label: 'الفكين معاً', value: 'Both' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTreatedJaw(opt.value as 'Upper'|'Lower'|'Both')}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border ${treatedJaw === opt.value ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-[0_2px_8px_rgba(0,113,227,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Appliance Type */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <label className="text-[14px] font-bold text-slate-700">نوع التقويم</label>
                            </div>
                            <div className="p-3 flex gap-2">
                                {[
                                    { label: 'معدني ثابت', value: 'Fixed Metal' },
                                    { label: 'شفاف', value: 'Clear' },
                                    { label: 'متحرك', value: 'Removable' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setApplianceType(opt.value as 'Fixed Metal'|'Clear'|'Removable')}
                                        className={`flex-1 py-3 text-sm font-bold rounded-xl border ${applianceType === opt.value ? 'bg-[#AF52DE] text-white border-[#AF52DE] shadow-[0_2px_8px_rgba(175,82,222,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Case Type & 4. Expansion */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <label className="text-[13px] font-bold text-slate-700">نوع الحالة</label>
                                </div>
                                <div className="p-3 gap-2 flex flex-col flex-1 justify-center">
                                    <button
                                        onClick={() => setCaseType('Extraction Case')}
                                        className={`w-full py-2.5 text-sm font-bold rounded-xl border ${caseType === 'Extraction Case' ? 'bg-[#FF3B30] text-white border-[#FF3B30] shadow-[0_2px_8px_rgba(255,59,48,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        حالة قلع (Extraction)
                                    </button>
                                    <button
                                        onClick={() => setCaseType('Non-Extraction Case')}
                                        className={`w-full py-2.5 text-sm font-bold rounded-xl border ${caseType === 'Non-Extraction Case' ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        بدون قلع (Non-Extraction)
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <label className="text-[13px] font-bold text-slate-700">Expansion (Hyrax)</label>
                                </div>
                                <div className="p-3 gap-2 flex flex-col flex-1 justify-center">
                                    <button
                                        onClick={() => setExpansion(true)}
                                        className={`w-full py-2.5 text-sm font-bold rounded-xl border ${expansion ? 'bg-[#32ADE6] text-white border-[#32ADE6] shadow-[0_2px_8px_rgba(50,173,230,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        نعم يحتاج
                                    </button>
                                    <button
                                        onClick={() => setExpansion(false)}
                                        className={`w-full py-2.5 text-sm font-bold rounded-xl border ${!expansion ? 'bg-[#FF9500] text-white border-[#FF9500] shadow-[0_2px_8px_rgba(255,149,0,0.3)]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} transition-all`}
                                    >
                                        لا يحتاج
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <label className="text-[14px] font-bold text-slate-700">التشخيص</label>
                            </div>
                            <div className="p-3">
                                <button
                                    onClick={() => setIsDiagnosisModalOpen(true)}
                                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:bg-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-[#0071E3]" />
                                        </div>
                                        <span className="text-[15px] font-bold text-slate-800">{diagnosis}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Doctor Selection (plan-level) ── */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <label className="text-[14px] font-bold text-slate-700">
                            الطبيب المعالج
                        </label>
                    </div>
                    
                    <div className="p-3">
                        <button
                            onClick={() => setIsDoctorModalOpen(true)}
                            className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                                    style={{ backgroundColor: doctors.find(d => d.id === selectedDoctorId)?.color || '#0071E3' }}
                                >
                                    {doctors.find(d => d.id === selectedDoctorId)?.name.charAt(0) || 'د'}
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[14px] font-bold text-slate-800">{doctors.find(d => d.id === selectedDoctorId)?.name}</span>
                                    <span className="text-[12px] font-medium text-slate-500">{doctors.find(d => d.id === selectedDoctorId)?.specialization}</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 shrink-0" />
                        </button>
                    </div>
                </section>

                {/* ── Manual Total Cost ── */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
                    <div className="p-3 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                        <label className="text-[14px] font-bold text-emerald-800 flex items-center gap-2">
                             <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            التكلفة الإجمالية
                        </label>
                    </div>
                    <div className="p-3 bg-slate-50/30">
                        <div className="relative">
                            <input
                                type="number"
                                value={manualCost}
                                onChange={(e) => setManualCost(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white border border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 rounded-xl pr-14 pl-4 py-3.5 text-left font-extrabold text-xl outline-none transition-all placeholder:text-slate-300 shadow-sm text-slate-800"
                                dir="ltr"
                            />
                            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center pointer-events-none">
                                <span className="text-[14px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded-lg">د.ع</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Attachments ── */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
                    <div className="p-3 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
                        <label className="text-[14px] font-bold text-blue-800">
                            المرفقات
                        </label>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[12px] font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" /> إضافة
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.stl"
                        className="hidden"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (!files) return;
                            const newAttachments = Array.from(files).map((file: File) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                name: file.name,
                                type: file.type,
                                url: URL.createObjectURL(file)
                            }));
                            setAttachments(prev => [...prev, ...newAttachments]);
                            e.target.value = '';
                        }}
                    />
                    
                    <div className="p-3 bg-slate-50/30">
                        {attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {attachments.map(att => (
                                    <div key={att.id} className="inline-flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm max-w-full group">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                            <Paperclip className="w-3 h-3 text-blue-500" />
                                        </div>
                                        <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[200px]" dir="ltr">{att.name}</span>
                                        <button
                                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                                            className="w-5 h-5 ml-1 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                                            aria-label="حذف المرفق"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div 
                                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors py-4"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1.5 border border-slate-100 text-blue-500">
                                    <Paperclip className="w-4 h-4" />
                                </div>
                                <p className="text-[13px] font-bold text-slate-600">انقر هنا لإضافة صور وملفات</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Medical Notes ── */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
                    <div className="p-3 border-b border-slate-100 bg-amber-50/50 flex items-center justify-between">
                        <label className="text-[14px] font-bold text-amber-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            ملاحظات الخطة العلاجية
                        </label>
                    </div>
                    <div className="p-3 bg-slate-50/30">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full min-h-[140px] bg-white border border-slate-200 focus:border-amber-300 focus:ring-4 focus:ring-amber-50 rounded-xl p-4 text-[14px] text-slate-700 font-medium outline-none resize-y transition-all placeholder:text-slate-400 placeholder:font-normal leading-relaxed shadow-sm"
                            placeholder="اكتب التوصيات الطبية والملاحظات العامة حول خطوات العلاج هنا..."
                        />
                    </div>
                </section>

                <div className="pt-4 animate-slide-up pb-8 [animation-delay:600ms]">
                    <button
                        onClick={handleSavePlan}
                        className="w-full bg-[#0071E3] text-white py-3.5 rounded-[12px] font-bold text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(0,113,227,0.2)]"
                    >
                        حفظ الخطة العلاجية
                    </button>
                </div>
            </main>

            {/* Treatment Selection Modal */}
            <Modal isOpen={isTreatmentModalOpen} onClose={() => setIsTreatmentModalOpen(false)} title="نوع العلاج">
                <div className="flex flex-col gap-2 p-2">
                    {toothTreatmentsList.map((item) => {
                        const isSelected = selectedTreatmentType?.name === item.name;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setSelectedTreatmentType(item);
                                    setIsTreatmentModalOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${
                                    isSelected 
                                        ? 'border-[#0071E3] bg-[#0071E3]/5 text-[#0056B3]' 
                                        : 'border-slate-200 hover:border-[#0071E3]/30 hover:bg-[#0071E3]/[0.02] text-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: item.color } as React.CSSProperties}
                                    />
                                    <span className="text-[15px] font-bold">{item.name}</span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'border-[#0071E3] bg-[#0071E3]' : 'border-slate-300'
                                }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Doctor Selection Modal */}
            <Modal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} title="اختر الطبيب المعالج">
                <div className="flex flex-col gap-2 p-2">
                    {doctors.map((doctor) => {
                        const isSelected = selectedDoctorId === doctor.id;
                        return (
                            <button
                                key={doctor.id}
                                onClick={() => {
                                    setSelectedDoctorId(doctor.id);
                                    setIsDoctorModalOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${
                                    isSelected 
                                        ? 'border-[#0071E3] bg-[#0071E3]/5' 
                                        : 'border-slate-200 hover:border-[#0071E3]/30 hover:bg-[#0071E3]/[0.02]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                                        style={{ backgroundColor: doctor.color || '#0071E3' }}
                                    >
                                        {doctor.name.charAt(0) || 'د'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[15px] font-bold ${isSelected ? 'text-[#0056B3]' : 'text-slate-800'}`}>{doctor.name}</span>
                                        <span className={`text-[13px] font-medium ${isSelected ? 'text-[#0071E3]/70' : 'text-slate-500'}`}>{doctor.specialization}</span>
                                    </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected ? 'border-[#0071E3] bg-[#0071E3]' : 'border-slate-300'
                                }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Diagnosis Selection Modal */}
            <Modal isOpen={isDiagnosisModalOpen} onClose={() => setIsDiagnosisModalOpen(false)} title="التشخيص">
                <div className="grid grid-cols-1 gap-2">
                    {[
                        'Class I', 'Class II', 'Class III', 'Bimax', 
                        'Median diastema', 'Crowding', 'Spacing', 
                        'Open Bite', 'Deep Bite', 'Crossbite', 
                        'Others (اكتب في الملاحظات)'
                    ].map((opt) => {
                        const isSelected = diagnosis === opt;
                        return (
                            <button
                                key={opt}
                                onClick={() => {
                                    setDiagnosis(opt);
                                    setIsDiagnosisModalOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right ${
                                    isSelected 
                                        ? 'border-[#0071E3] bg-[#0071E3]/10 shadow-[0_2px_8px_rgba(0,113,227,0.15)]' 
                                        : 'border-apple-separator bg-white hover:bg-apple-fill'
                                }`}
                            >
                                <span className={`text-[15px] font-bold ${isSelected ? 'text-[#0056B3]' : 'text-slate-700'}`}>
                                    {opt}
                                </span>
                                {isSelected && <Check className="w-5 h-5 text-[#0071E3]" />}
                                {!isSelected && <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                            </button>
                        );
                    })}
                </div>
            </Modal>

            {/* Crown Material Selection Modal */}
            <Modal isOpen={!!crownModalData} onClose={() => setCrownModalData(null)} title="اختر نوع التغليف">
                <div className="p-2 space-y-3">
                    <p className="text-sm font-semibold text-slate-600 text-center mb-4">
                        اختر نوع المادة للسن رقم <span className="text-[#0071E3] font-bold px-1.5 py-0.5 bg-[#0071E3]/10 rounded-md">{crownModalData?.tooth}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { id: 'zircon', label: 'زاركون (Zirconia)', color: 'border-blue-400', bg: 'hover:bg-blue-50' },
                            { id: 'emax', label: 'إيماكس (Emax)', color: 'border-purple-400', bg: 'hover:bg-purple-50' },
                            { id: 'resin', label: 'رزن دائمي (Permanent Resin)', color: 'border-emerald-400', bg: 'hover:bg-emerald-50' },
                            { id: 'temp', label: 'مؤقت (Temporary)', color: 'border-amber-400', bg: 'hover:bg-amber-50' },
                        ].map((mat) => (
                            <button
                                key={mat.id}
                                onClick={() => {
                                    handleCrownMaterialSelect(mat.label);
                                    haptic.light();
                                }}
                                className={`w-full p-4 rounded-xl border-2 ${mat.color} bg-white ${mat.bg} shadow-sm transition-all active:scale-95 text-right flex items-center justify-between group`}
                            >
                                <span className="text-[15px] font-bold text-slate-800">{mat.label}</span>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${mat.color}`}>
                                    <Check className="w-4 h-4 text-slate-600" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
