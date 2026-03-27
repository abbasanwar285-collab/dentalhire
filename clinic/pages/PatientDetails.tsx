
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone, Plus, Check, Calendar as CalendarIcon,
    Stethoscope, Edit, ChevronUp,
    Sparkles, XCircle, StickyNote,
    User, Lock, Camera, Wallet, ChevronRight, SquarePen, FileText, CheckCircle2
} from 'lucide-react';
import { db } from '../services/db';
import { Patient, Procedure, TREATMENT_TYPES, DOCTORS, PaymentRecord, Appointment } from '../types';
import { DentalChart } from '../components/DentalChart';
import { XrayCaptureModal, XrayViewerModal, XrayPaymentModal } from '../components/XrayModal';
import { PasswordModal } from '../components/PasswordModal';
// PatientScans removed to reduce bandwidth
import { DifficultyPrompt } from '../components/DifficultyPrompt';
import { Tabs } from '../components/Tabs';
import { managerService } from '../services/managerService';
import { useDoctorContext } from '../hooks/useDoctorContext';
import { useAuth } from '../contexts/AuthContext';
import { ProcedureItem, OrthoVisitItem } from '../components/patient';
import { usePatientFinancials } from '../hooks/usePatientFinancials';
// import { SmartPatientSummary } from '../components/SmartPatientSummary'; // TODO: Enable when ready
// import { SmartTreatmentSuggestions } from '../components/SmartTreatmentSuggestions'; // TODO: Enable when ready




// Helper to get local date YYYY-MM-DD
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const PatientDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentDoctorId: _currentDoctorId } = useDoctorContext();
    const { isAssistant } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const patientRef = useRef<Patient | null>(null); // Ref to hold latest patient state

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'treatment' | 'ortho'>('treatment');
    const [showPaymentHistoryFor, setShowPaymentHistoryFor] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Forms State
    const [showAddProcedure, setShowAddProcedure] = useState(false);
    const [newProcedure, setNewProcedure] = useState<Partial<Procedure>>({
        type: TREATMENT_TYPES[0],
        tooth: '',
        price: 0,
        status: 'planned',
        doctorId: DOCTORS[0].id,
        notes: '',
        xrayImages: []
    });

    // Per-tooth treatment mapping: { "18": "حشوة جذر", "17": "تنظيف", ... }
    const [toothTreatments, setToothTreatments] = useState<Record<string, string>>({});

    // X-ray Modal States
    const [showXrayCaptureModal, setShowXrayCaptureModal] = useState(false);
    const [showXrayViewerModal, setShowXrayViewerModal] = useState(false);
    const [showXrayPaymentModal, setShowXrayPaymentModal] = useState(false);
    const [currentXrayImages, setCurrentXrayImages] = useState<string[]>([]);
    const [xrayPaymentProcId, setXrayPaymentProcId] = useState<string | null>(null);
    const [xrayPaymentAmount, setXrayPaymentAmount] = useState('');

    const [paymentInput, setPaymentInput] = useState<{ procId: string, amount: string } | null>(null);
    const paymentInputRef = useRef(paymentInput); // Ref for payment input

    const [orthoForm, setOrthoForm] = useState({
        upperArch: '',
        lowerArch: '',
        paymentReceived: '',
        notes: '',
        visitDate: getLocalDateStr()
    });

    const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
    const [isEditingOrthoHeader, setIsEditingOrthoHeader] = useState(false);
    const [_openDentalChart, _setOpenDentalChart] = useState(false);

    // Ortho Header Edit State
    const [editOrthoData, setEditOrthoData] = useState({
        diagnosis: '',
        totalCost: 0,
        doctorId: 'dr_ali'
    });

    // Password Protection for Ortho Financial Data
    const [isOrthoUnlocked, setIsOrthoUnlocked] = useState(false);
    const [showOrthoUnlockModal, setShowOrthoUnlockModal] = useState(false);
    const [_orthoPassword, _setOrthoPassword] = useState('');
    const [_orthoPasswordError, _setOrthoPasswordError] = useState(false);

    // Header Edit State
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [headerForm, setHeaderForm] = useState({
        name: '',
        mobile: '',
        age: 0,
        gender: '',
        diagnosis: ''
    });

    useEffect(() => {
        loadPatient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Check if ortho data is unlocked
    useEffect(() => {
        const isUnlocked = localStorage.getItem('ortho_unlocked') === 'true';
        setIsOrthoUnlocked(isUnlocked);
    }, []);

    const isOrthoPatient = patient && (
        (patient.orthoDiagnosis && patient.orthoDiagnosis.trim().length > 0) ||
        (patient.orthoVisits && patient.orthoVisits.length > 0)
    );

    const handleGlobalUnlock = () => {
        setIsOrthoUnlocked(true);
        localStorage.setItem('ortho_unlocked', 'true');
        setShowOrthoUnlockModal(false); // Close generic modal if open
    };

    // Update refs whenever state changes
    useEffect(() => {
        patientRef.current = patient;
    }, [patient]);

    useEffect(() => {
        paymentInputRef.current = paymentInput;
    }, [paymentInput]);

    const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);

    const loadPatient = async () => {
        if (!id) {
            return;
        }
        const [patientData, allAppointments] = await Promise.all([
            db.getPatientById(id),
            db.getAppointments()
        ]);

        if (patientData) {
            // Default ortho doctor if not set
            if (!patientData.orthoDoctorId) {
                patientData.orthoDoctorId = 'dr_ali';
            }
            setPatient(patientData);
            setEditOrthoData({
                diagnosis: patientData.orthoDiagnosis || '',
                totalCost: patientData.orthoTotalCost || 0,
                doctorId: patientData.orthoDoctorId || 'dr_ali'
            });

            // Calculate Next Appointment
            const todayStr = getLocalDateStr();
            const upcoming = allAppointments
                .filter(a => a.patientId === id && a.date >= todayStr && a.status !== 'cancelled' && a.status !== 'completed')
                .sort((a, b) => a.date.localeCompare(b.date));

            setNextAppointment(upcoming.length > 0 ? upcoming[0] : null);
        }
        setLoading(false);
    };




    // Difficulty Tracker State
    const [difficultyPrompt, setDifficultyPrompt] = useState<{
        isOpen: boolean;
        context: string;
    }>({ isOpen: false, context: '' });

    const handleSave = useCallback(async (updatedPatient: Patient) => {
        setPatient(updatedPatient); // Optimistic update
        await db.savePatient(updatedPatient);
    }, []);

    // --- Deletion Handlers (Optimized) ---

    const handleDeleteProcedure = useCallback(async (procId: string) => {
        const currentPatient = patientRef.current;
        if (!currentPatient || !id) {
            return;
        }
        if (!window.confirm('هل أنت متأكد من حذف هذه الخطة العلاجية نهائياً؟')) {
            return;
        }

        // Optimistic UI Update
        const updatedProcedures = currentPatient.procedures.filter(p => p.id !== procId);
        setPatient({ ...currentPatient, procedures: updatedProcedures });

        // DB Call
        const success = await db.deleteProcedure(id, procId);
        if (!success) {
            alert('حدث خطأ أثناء الحذف، يرجى إعادة تحميل الصفحة.');
            loadPatient(); // Revert logic by reloading
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleDeleteOrthoVisit = useCallback(async (visitId: string) => {
        const currentPatient = patientRef.current;
        if (!currentPatient || !id) {
            return;
        }
        if (!window.confirm('هل أنت متأكد من حذف هذه الزيارة نهائياً؟')) {
            return;
        }

        // Optimistic UI Update
        const updatedVisits = (currentPatient.orthoVisits || []).filter(v => v.id !== visitId);
        setPatient({ ...currentPatient, orthoVisits: updatedVisits });

        // DB Call
        const success = await db.deleteOrthoVisit(id, visitId);
        if (!success) {
            alert('حدث خطأ أثناء الحذف، يرجى إعادة تحميل الصفحة.');
            loadPatient();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleCompleteProcedure = useCallback(async (procId: string) => {
        const currentPatient = patientRef.current;
        if (!currentPatient || !id) {
            return;
        }

        const procToComplete = currentPatient.procedures.find(p => p.id === procId);
        if (!procToComplete) {
            return;
        }

        // Optimistic
        const updatedProcedures = currentPatient.procedures.map(p =>
            p.id === procId ? { ...p, status: 'completed' as const } : p
        );
        const updatedPatient = { ...currentPatient, procedures: updatedProcedures };
        setPatient(updatedPatient);

        // Trigger Difficulty Tracker
        setDifficultyPrompt({
            isOpen: true,
            context: procToComplete.type
        });

        // DB Call
        await db.savePatient(updatedPatient);

    }, [id]);

    // --- Financial Calculations (using extracted hook) ---
    const financials = usePatientFinancials(patient);

    // --- Procedure Logic ---


    // --- X-ray Handlers ---
    const handleCaptureXrayForNewProcedure = (imageBase64: string) => {
        setNewProcedure(prev => ({
            ...prev,
            xrayImages: [...(prev.xrayImages || []), imageBase64]
        }));
    };

    const handleViewXray = (images: string[]) => {
        setCurrentXrayImages(images);
        setShowXrayViewerModal(true);
    };

    const handleOpenPaymentModal = (procId: string) => {
        setXrayPaymentProcId(procId);
        setXrayPaymentAmount('');
        setShowXrayPaymentModal(true);
    };

    const handlePaymentWithXray = async () => {
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);
        if (amount <= 0) {
            return;
        }

        // Open camera for X-ray
        setShowXrayPaymentModal(false);
        setShowXrayCaptureModal(true);
    };

    const handleCaptureXrayForPayment = async (imageBase64: string) => {
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);

        const newPayment: PaymentRecord = {
            id: Date.now().toString(),
            amount: amount,
            date: getLocalDateStr(),
            timestamp: Date.now()
        };

        const updatedProcedures = patient.procedures.map(proc => {
            if (proc.id === xrayPaymentProcId) {
                return {
                    ...proc,
                    payments: [newPayment, ...(proc.payments || [])],
                    xrayImages: [...(proc.xrayImages || []), imageBase64]
                };
            }
            return proc;
        });

        const updatedPatient = { ...patient, procedures: updatedProcedures };
        await handleSave(updatedPatient);

        setShowXrayCaptureModal(false);
        setXrayPaymentProcId(null);
        setXrayPaymentAmount('');
    };

    const handlePaymentWithoutXray = async () => {
        if (isSaving) {
            return;
        }
        if (!patient || !xrayPaymentProcId) {
            return;
        }
        const amount = Number(xrayPaymentAmount);
        if (amount <= 0) {
            return;
        }

        // Close UI immediately as requested by user
        setShowXrayPaymentModal(false);
        setIsSaving(true);

        try {
            const newPayment: PaymentRecord = {
                id: Date.now().toString(),
                amount: amount,
                date: getLocalDateStr(),
                timestamp: Date.now()
            };

            const updatedProcedures = patient.procedures.map(proc => {
                if (proc.id === xrayPaymentProcId) {
                    return {
                        ...proc,
                        payments: [newPayment, ...(proc.payments || [])]
                    };
                }
                return proc;
            });

            const updatedPatient = { ...patient, procedures: updatedProcedures };
            setPatient(updatedPatient); // Optimistic update
            await db.savePatient(updatedPatient);
        } catch (e) {
            console.error(e);
            alert('حدث خطأ في الحفظ');
        } finally {
            setIsSaving(false);
            setXrayPaymentProcId(null);
            setXrayPaymentAmount('');
        }
    };

    const _handleCancelXray = useCallback(() => {
        setNewProcedure(prev => ({ ...prev, xrayImages: [] }));
        setShowXrayCaptureModal(false);
    }, []);

    const handleEditProcedure = useCallback((proc: Procedure) => {
        // Parse toothTreatments from the procedure
        const teethArr = proc.tooth ? proc.tooth.split(',').map(s => s.trim()).filter(Boolean) : [];
        const initialTreatments: Record<string, string> = {};
        teethArr.forEach(t => {
            initialTreatments[t] = proc.type;
        });
        setToothTreatments(initialTreatments);

        setNewProcedure({
            tooth: proc.tooth,
            type: proc.type,
            price: proc.price,
            status: proc.status,
            doctorId: proc.doctorId || DOCTORS[0].id,
            notes: proc.notes || '',
            xrayImages: proc.xrayImages || []
        });
        // We delete the old one and add as new to simulate "edit" in this simple local-first approach
        // Ideally we would have an 'editingId' state, but this works for quick editing
        // Alternatively, we can set an 'editingId' and update 'addProcedure' to handle updates.
        // For now, let's go with the simpler delete-then-add flow BUT prompting the user might be jarring.
        // Better: Set an editing state.

        // Let's implement proper edit state
        // For now, to keep it simple as requested:
        // We will scroll to top, populate form, and changing "Add" button to "Update" if we had an ID.
        // But our newProcedure state doesn't have ID. 
        // Let's just remove the old one directly? No that's dangerous.

        // Let's add a temporary `editingId` state.
        setEditingProcedureId(proc.id);
        setShowAddProcedure(true);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }, []);

    const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);

    const addProcedure = useCallback(async () => {
        if (!newProcedure.type) {
            return;
        }

        const procedure: Procedure = {
            id: editingProcedureId || Date.now().toString(),
            tooth: newProcedure.tooth || '', // Ensure tooth is never undefined
            type: newProcedure.type || TREATMENT_TYPES[0],
            price: newProcedure.price || 0,
            status: newProcedure.status as any || 'planned',
            doctorId: newProcedure.doctorId || DOCTORS[0].id,
            notes: newProcedure.notes || '',
            xrayImages: newProcedure.xrayImages || [],
            date: editingProcedureId ? (patient?.procedures.find(p => p.id === editingProcedureId)?.date || getLocalDateStr()) : getLocalDateStr(),
            payments: editingProcedureId ? (patient?.procedures.find(p => p.id === editingProcedureId)?.payments || []) : []
        };

        const updatedProcedures = editingProcedureId
            ? (patient?.procedures.map(p => p.id === editingProcedureId ? procedure : p) || [])
            : [...(patient?.procedures || []), procedure];

        await handleSave({ ...patient!, procedures: updatedProcedures });

        // Trigger AI analysis if there are notes
        if (procedure.notes) {
            managerService.processNewNote(procedure.notes, patient!.id).catch(console.error);
        }



        setNewProcedure({
            tooth: '',
            type: TREATMENT_TYPES[0],
            price: 0,
            status: 'planned',
            doctorId: DOCTORS[0].id,
            xrayImages: []
        });
        setToothTreatments({});
        setEditingProcedureId(null);
        setShowAddProcedure(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newProcedure, patient, handleSave, editingProcedureId]);

    const addPaymentToProcedure = useCallback(async (procId: string) => {
        const currentPatient = patientRef.current;
        const currentInput = paymentInputRef.current;

        if (!currentPatient || !currentInput || currentInput.procId !== procId) {
            return;
        }

        // Prevent double submission if currently saving (we check this via ref or simple state logic handling in parent if passed down, 
        // but since this is inside callback, we rely on parent re-render to disable button)
        // However, to be safe inside the function:
        if (isSaving) {
            return;
        }

        const amount = Number(currentInput.amount);
        if (amount <= 0) {
            return;
        }

        setIsSaving(true);
        try {

            const newPayment: PaymentRecord = {
                id: Date.now().toString(),
                amount: amount,
                date: getLocalDateStr(),
                timestamp: Date.now()
            };

            const updatedProcedures = currentPatient.procedures.map(proc => {
                if (proc.id === procId) {
                    return {
                        ...proc,
                        payments: [newPayment, ...(proc.payments || [])]
                    };
                }
                return proc;
            });

            // Use handleSave logic directly to avoid dependency on handleSave
            const updatedPatient = { ...currentPatient, procedures: updatedProcedures };
            setPatient(updatedPatient);
            setPaymentInput(null); // Close UI immediately to prevent double-clicks and improve speed

            await db.savePatient(updatedPatient);
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.'); // Optional: simple error feedback
            loadPatient(); // Revert on error
        } finally {
            setIsSaving(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSaving]);

    // --- Ortho Logic ---
    const addOrthoVisit = async () => {
        if (!patient || isSaving) {
            return;
        }

        setIsSaving(true);
        try {

            const visit = {
                id: Date.now().toString(),
                monthNumber: (patient.orthoVisits?.length || 0) + 1 + '',
                procedure: `Upper: ${orthoForm.upperArch || '-'} | Lower: ${orthoForm.lowerArch || '-'}`,
                notes: orthoForm.notes,
                paymentReceived: Number(orthoForm.paymentReceived) || 0,
                visitDate: orthoForm.visitDate
            };

            const updated = {
                ...patient,
                orthoVisits: [visit, ...(patient.orthoVisits || [])]
            };

            await handleSave(updated);
            setOrthoForm({ upperArch: '', lowerArch: '', paymentReceived: '', notes: '', visitDate: getLocalDateStr() });
        } catch (e) {
            console.error(e)
        } finally {
            setIsSaving(false);
        }
    };

    const saveOrthoHeader = async () => {
        if (!patient) {
            return;
        }
        const updated = {
            ...patient,
            orthoDiagnosis: editOrthoData.diagnosis,
            orthoTotalCost: Number(editOrthoData.totalCost),
            orthoDoctorId: editOrthoData.doctorId
        };
        await handleSave(updated);
        setIsEditingOrthoHeader(false);
    };

    const handleEditHeader = () => {
        if (!patient) {
            return;
        }
        setHeaderForm({
            name: patient.name,
            mobile: patient.mobile || '',
            age: patient.age,
            gender: patient.gender || '',
            diagnosis: patient.diagnosis || ''
        });
        setIsEditingHeader(true);
    };

    const saveHeader = async () => {
        if (!patient) {
            return;
        }
        const updated = {
            ...patient,
            name: headerForm.name,
            mobile: headerForm.mobile,
            age: Number(headerForm.age),
            gender: headerForm.gender,
            diagnosis: headerForm.diagnosis
        };
        await handleSave(updated);
        setIsEditingHeader(false);
    };

    // Old modal logic removed


    if (loading || !patient) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">جاري التحميل...</div>;
    }

    const orthoTotalPaid = (patient.orthoVisits || []).reduce((sum, v) => sum + Number(v.paymentReceived || 0), 0);

    // BLOCKED VIEW FOR ORTHO PATIENTS
    if (isOrthoPatient && !isOrthoUnlocked) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl text-center max-w-md w-full">
                    <div className="mx-auto w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <Lock size={40} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">ملف محمي</h2>
                    <p className="text-gray-400 mb-8">
                        هذا الملف خاص بمرضى التقويم. يرجى إدخال كلمة المرور للمتابعة.
                    </p>
                    <button
                        onClick={() => setShowOrthoUnlockModal(true)}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition shadow-lg shadow-violet-600/20"
                    >
                        فتح الملف
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-4 py-3 text-gray-500 hover:text-gray-300 font-medium transition"
                    >
                        عودة للقائمة
                    </button>
                </div>

                <PasswordModal
                    isOpen={showOrthoUnlockModal}
                    onClose={() => setShowOrthoUnlockModal(false)}
                    onSuccess={handleGlobalUnlock}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Sub-Header / Back Button */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white hover:bg-violet-600 transition"
                        title="رجوع"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white">ملف المريض</h2>
                        <p className="text-gray-400 text-[10px]">تفاصيل السجل الطبي والمالي</p>
                    </div>
                </div>
            </div>

            {/* Header: Name and Quick Stats */}
            <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-700 relative overflow-hidden group mb-6">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 w-full">

                    <div className={`flex ${isEditingHeader ? 'flex-col items-stretch' : 'flex-row items-center'} gap-4 w-full md:w-auto flex-1`}>

                        <div className="flex-1">
                            {isEditingHeader ? (
                                <div className="space-y-3 bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
                                    <input
                                        type="text"
                                        value={headerForm.name}
                                        onChange={(e) => setHeaderForm({ ...headerForm, name: e.target.value })}
                                        className="text-xl font-bold bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 w-full outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
                                        placeholder="اسم المريض"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={headerForm.mobile}
                                            onChange={(e) => setHeaderForm({ ...headerForm, mobile: e.target.value })}
                                            className="text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 flex-1 outline-none focus:border-violet-500"
                                            placeholder="رقم الهاتف"
                                        />
                                        <input
                                            type="number"
                                            value={headerForm.age}
                                            onChange={(e) => setHeaderForm({ ...headerForm, age: Number(e.target.value) })}
                                            className="text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 w-20 outline-none focus:border-violet-500"
                                            placeholder="العمر"
                                        />
                                        <select
                                            value={headerForm.gender}
                                            onChange={(e) => setHeaderForm({ ...headerForm, gender: e.target.value })}
                                            title="الجنس"
                                            className="text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                                        >
                                            <option value="">الجنس</option>
                                            <option value="Male">ذكر</option>
                                            <option value="Female">أنثى</option>
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        value={headerForm.diagnosis}
                                        onChange={(e) => setHeaderForm({ ...headerForm, diagnosis: e.target.value })}
                                        title="التشخيص العام"
                                        className="text-sm bg-gray-800 text-gray-300 border border-gray-600 rounded-lg px-3 py-2 w-full outline-none focus:border-violet-500"
                                        placeholder="التشخيص العام..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2 leading-tight">
                                        {patient.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-violet-500/30 transition-colors">
                                            <Phone size={14} className="text-violet-400" />
                                            <span className="dir-ltr">{patient.mobile || 'لا يوجد رقم'}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-pink-500/30 transition-colors">
                                            <User size={14} className="text-pink-400" />
                                            {patient.age} سنة {patient.gender === 'Male' ? '(ذكر)' : patient.gender === 'Female' ? '(أنثى)' : ''}
                                        </span>
                                        {patient.diagnosis && (
                                            <span className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-yellow-500/30 transition-colors">
                                                <Stethoscope size={14} className="text-yellow-400" />
                                                <span className="font-bold">{patient.diagnosis}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={`flex items-center gap-2 flex-shrink-0 ${isEditingHeader ? 'justify-center w-full' : ''}`}>
                            <button
                                onClick={() => isEditingHeader ? saveHeader() : handleEditHeader()}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-95 ${isEditingHeader
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-600 hover:text-white'
                                    }`}
                                title={isEditingHeader ? "حفظ التغييرات" : "تعديل المعلومات"}
                            >
                                {isEditingHeader ? <Check size={24} /> : <SquarePen size={22} />}
                            </button>
                        </div>


                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
                        <button
                            onClick={() => handleSave({ ...patient, consultationFeePaid: !patient.consultationFeePaid })}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${patient.consultationFeePaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            {patient.consultationFeePaid ? <CheckCircle2 size={16} /> : <Wallet size={16} />}
                            {patient.consultationFeePaid ? 'تم دفع الكشفية' : 'دفع الكشفية'}
                        </button>

                        <button
                            onClick={() => navigate(`/appointments?patientId=${patient.id}`)}
                            className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-bold transition flex items-center gap-2"
                        >
                            <CalendarIcon size={16} />
                            حجز موعد
                        </button>
                    </div>
                </div>




                {/* Next Appointment Banner */}
                {nextAppointment && (
                    <div className="mt-4 bg-gradient-to-r from-violet-600/20 to-violet-900/20 border border-violet-500/30 rounded-2xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <div className="text-xs text-violet-300 font-bold mb-0.5">الموعد القادم</div>
                                <div className="text-white font-bold flex items-center gap-2">
                                    {nextAppointment.date}
                                    <span className="text-xs bg-violet-500/20 px-2 py-0.5 rounded text-violet-200">
                                        {new Date(nextAppointment.date).toLocaleDateString('ar-EG', { weekday: 'long' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-gray-400">
                            {nextAppointment.time}
                        </div>
                    </div>
                )}

                {/* Financial Summary */}
                <div className="mt-6 bg-gray-800/80 border border-gray-700 rounded-2xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap justify-between items-center backdrop-blur-md gap-3 sm:gap-0">
                    <div className="text-center flex-1 border-l border-gray-700 last:border-0">
                        <div className="text-[10px] text-gray-400 mb-0.5 sm:mb-1 uppercase tracking-wider">الكلي</div>
                        <div className="font-bold text-base sm:text-lg dir-ltr text-white">{financials.total.toLocaleString()}</div>
                    </div>
                    <div className="text-center flex-1 border-l border-gray-700 last:border-0">
                        <div className="text-[10px] text-emerald-400 mb-0.5 sm:mb-1 uppercase tracking-wider">الواصل</div>
                        <div className="font-bold text-base sm:text-lg text-emerald-300 dir-ltr">{financials.paid.toLocaleString()}</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-[10px] text-rose-400 mb-0.5 sm:mb-1 uppercase tracking-wider">المتبقي</div>
                        <div className="font-bold text-base sm:text-lg text-rose-300 dir-ltr">{financials.debt.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* --- Tabs --- */}
            <div className="px-4 -mt-6 relative z-20">
                <Tabs
                    activeTab={activeTab}
                    onChange={(id) => {
                        setActiveTab(id as any);
                        if (id === 'ortho' && !patient.orthoDoctorId) {
                            handleSave({ ...patient, orthoDoctorId: 'dr_ali' });
                        }
                    }}
                    tabs={[
                        { id: 'treatment', label: 'خطة العلاج', icon: FileText },
                        { id: 'ortho', label: 'التقويم', icon: Sparkles },
                    ]}
                />
            </div>

            <div className="p-4 space-y-6">

                {/* === TREATMENT TAB === */}
                {activeTab === 'treatment' && (
                    <>
                        {/* Notes Section (Moved from Overview) */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl relative mb-6">
                            <StickyNote className="absolute top-3 left-3 text-yellow-500/50" size={16} />
                            <textarea
                                className="w-full bg-transparent border-none text-yellow-100/90 text-right leading-relaxed outline-none resize-none h-20 placeholder-yellow-500/30"
                                placeholder="ملاحظات طبية عامة..."
                                value={patient.notes || ''}
                                onChange={(e) => handleSave({ ...patient, notes: e.target.value })}
                            />
                        </div>

                        {/* Add Procedure Button */}
                        {/* Add Procedure Button */}
                        {!isAssistant && (
                            <button
                                onClick={() => setShowAddProcedure(!showAddProcedure)}
                                className="w-full py-4 rounded-2xl border-2 border-dashed border-violet-500/30 text-violet-400 font-bold flex items-center justify-center gap-2 hover:bg-violet-500/5 transition bg-gray-800/30"
                            >
                                {showAddProcedure ? <ChevronUp /> : <Plus />}
                                إضافة خطة علاجية جديدة
                            </button>
                        )}

                        {/* Add Procedure Form */}
                        {showAddProcedure && (
                            <div className="bg-gray-800/60 backdrop-blur-md p-5 rounded-3xl shadow-lg border border-gray-700 animate-in slide-in-from-top-4 fade-in duration-300">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            setNewProcedure({
                                                tooth: '',
                                                type: TREATMENT_TYPES[0],
                                                price: 0,
                                                status: 'planned',
                                                doctorId: DOCTORS[0].id,
                                                xrayImages: []
                                            });
                                            setToothTreatments({});
                                            setEditingProcedureId(null);
                                            setShowAddProcedure(false);
                                        }}
                                        className="mb-6 text-gray-500 hover:text-white flex items-center gap-2"
                                    >
                                        <XCircle size={18} />
                                        إلغاء
                                    </button>
                                </div>

                                {/* Dental Chart - Per-Tooth Treatment Selection */}
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-400 mb-2 block">انقر على سن لتحديد العلاج</label>
                                    <DentalChart
                                        toothTreatments={toothTreatments}
                                        onToothTreatmentChange={(treatments) => {
                                            setToothTreatments(treatments);
                                            // Generate a descriptive string: "18: حشوة جذر, 17: تنظيف"
                                            const treatmentDesc = Object.entries(treatments)
                                                .sort(([a], [b]) => Number(a) - Number(b))
                                                .map(([id, type]) => `${id}: ${type}`)
                                                .join(', ');

                                            setNewProcedure({
                                                ...newProcedure,
                                                tooth: Object.keys(treatments).join(', '),
                                                type: treatmentDesc || TREATMENT_TYPES[0]
                                            });
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">السعر الكلي</label>
                                        <input
                                            type="number"
                                            placeholder=""
                                            className="w-full p-3 bg-gray-700/50 text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/50 text-sm dir-ltr"
                                            value={newProcedure.price === 0 ? '' : newProcedure.price}
                                            onChange={e => setNewProcedure({ ...newProcedure, price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 mb-1 block">الطبيب المعالج</label>
                                        <select
                                            className="w-full p-3 bg-gray-700/50 text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/50 text-sm font-bold"
                                            value={newProcedure.doctorId}
                                            onChange={e => setNewProcedure({ ...newProcedure, doctorId: e.target.value })}
                                        >
                                            {DOCTORS.map(d => (
                                                <option
                                                    key={d.id}
                                                    value={d.id}
                                                    className="font-bold bg-gray-800"
                                                >
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-400 mb-1 block">ملاحظات</label>
                                    <textarea
                                        placeholder="ملاحظات إضافية..."
                                        className="w-full p-3 bg-gray-700/50 text-white rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/50 text-sm h-20 resize-none"
                                        value={newProcedure.notes || ''}
                                        onChange={e => setNewProcedure({ ...newProcedure, notes: e.target.value })}
                                    />
                                </div>

                                {/* X-ray Capture Section */}
                                <div className="mb-4 bg-violet-500/10 p-4 rounded-xl border border-violet-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Camera size={18} className="text-violet-400" />
                                            <span className="text-sm font-bold text-violet-300">صور الأشعة</span>
                                        </div>
                                        {newProcedure.xrayImages && newProcedure.xrayImages.length > 0 && (
                                            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">
                                                {newProcedure.xrayImages.length} صورة
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowXrayCaptureModal(true)}
                                        className="w-full py-3 rounded-xl border-2 border-dashed border-violet-500/40 text-violet-400 font-bold flex items-center justify-center gap-2 hover:bg-violet-500/10 transition"
                                    >
                                        <Camera size={20} />
                                        التقاط صورة أشعة
                                    </button>
                                    {/* Preview thumbnails */}
                                    {newProcedure.xrayImages && newProcedure.xrayImages.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto py-1">
                                            {newProcedure.xrayImages.map((img, idx) => (
                                                <div key={idx} className="relative flex-shrink-0">
                                                    <img
                                                        src={img}
                                                        alt={`X-ray ${idx + 1}`}
                                                        className="w-16 h-16 object-cover rounded-lg border border-violet-500/30"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = [...(newProcedure.xrayImages || [])];
                                                            updated.splice(idx, 1);
                                                            setNewProcedure({ ...newProcedure, xrayImages: updated });
                                                        }}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                                                        title="حذف الصورة"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={addProcedure}
                                    className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition hover:bg-violet-700"
                                >
                                    {editingProcedureId ? 'تحديث الإجراء' : 'حفظ الإجراء'}
                                </button>
                            </div>
                        )}

                        {/* Procedures List */}
                        <div className="space-y-4">
                            {patient.procedures.length === 0 && !showAddProcedure && (
                                <div className="text-center py-10 text-gray-500">
                                    <Stethoscope size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>لا توجد خطط علاجية مسجلة</p>
                                </div>
                            )}
                            {/* PLANNED PROCEDURES */}
                            <div className="space-y-3 mb-8">
                                <h3 className="text-gray-400 font-bold text-sm flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                                    خطط العلاج (Planned)
                                </h3>
                                {patient.procedures.filter(p => p.status === 'planned').length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-700/50 rounded-2xl text-gray-500 text-sm">
                                        لا توجد خطط علاجية حالياً
                                    </div>
                                )}
                                {patient.procedures.filter(p => p.status === 'planned').map((proc) => {
                                    const doctor = DOCTORS.find(d => d.id === proc.doctorId) || DOCTORS[0];
                                    return (
                                        <ProcedureItem
                                            key={proc.id}
                                            proc={proc}
                                            doctor={doctor}
                                            onDelete={handleDeleteProcedure}
                                            onAddPayment={addPaymentToProcedure}
                                            onToggleHistory={(id) => setShowPaymentHistoryFor(showPaymentHistoryFor === id ? null : id)}
                                            showHistory={showPaymentHistoryFor === proc.id}
                                            paymentInput={paymentInput}
                                            setPaymentInput={setPaymentInput}
                                            onViewXray={handleViewXray}
                                            onOpenPaymentModal={handleOpenPaymentModal}
                                            onComplete={handleCompleteProcedure}
                                            onEdit={handleEditProcedure}
                                            isSaving={isSaving}
                                            readOnly={isAssistant}
                                        />
                                    );
                                })}
                            </div>

                            {/* COMPLETED PROCEDURES */}
                            <div className="space-y-3">
                                <h3 className="text-gray-400 font-bold text-sm flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    السجل الطبي (Completed)
                                </h3>
                                {patient.procedures.filter(p => p.status !== 'planned').length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-700/50 rounded-2xl text-gray-500 text-sm">
                                        لا يوجد سجل طبي سابق
                                    </div>
                                )}
                                {patient.procedures.filter(p => p.status !== 'planned').map((proc) => {
                                    const doctor = DOCTORS.find(d => d.id === proc.doctorId) || DOCTORS[0];
                                    return (
                                        <ProcedureItem
                                            key={proc.id}
                                            proc={proc}
                                            doctor={doctor}
                                            onDelete={handleDeleteProcedure}
                                            onAddPayment={addPaymentToProcedure}
                                            onToggleHistory={(id) => setShowPaymentHistoryFor(showPaymentHistoryFor === id ? null : id)}
                                            showHistory={showPaymentHistoryFor === proc.id}
                                            paymentInput={paymentInput}
                                            setPaymentInput={setPaymentInput}
                                            onViewXray={handleViewXray}
                                            onOpenPaymentModal={handleOpenPaymentModal}
                                            onComplete={handleCompleteProcedure}
                                            onEdit={handleEditProcedure}
                                            isSaving={isSaving}
                                            readOnly={isAssistant}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* === ORTHO TAB === */}
                {activeTab === 'ortho' && (
                    <div className="space-y-6">

                        {/* Ortho Header Info */}
                        <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-gray-700">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-2 opacity-80">
                                    <Sparkles size={18} className="text-yellow-300" />
                                    <h3 className="font-bold">ملف التقويم</h3>
                                </div>
                                <button
                                    onClick={() => isEditingOrthoHeader ? saveOrthoHeader() : setIsEditingOrthoHeader(true)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition"
                                >
                                    {isEditingOrthoHeader ? <Check size={16} className="text-emerald-300" /> : <Edit size={16} />}
                                </button>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <label className="text-[10px] text-gray-400 block mb-1">التشخيص / نوع الجهاز</label>
                                    {isEditingOrthoHeader ? (
                                        <input
                                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-violet-500 text-white"
                                            value={editOrthoData.diagnosis}
                                            onChange={e => setEditOrthoData({ ...editOrthoData, diagnosis: e.target.value })}
                                        />
                                    ) : (
                                        <div className="font-bold text-lg">{patient.orthoDiagnosis || 'لم يتم تحديد التشخيص'}</div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 block mb-1">الكلفة الكلية</label>
                                        {isEditingOrthoHeader ? (
                                            isOrthoUnlocked ? (
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-violet-500 text-white dir-ltr"
                                                    value={editOrthoData.totalCost === 0 ? '' : editOrthoData.totalCost}
                                                    onChange={e => setEditOrthoData({ ...editOrthoData, totalCost: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setShowOrthoUnlockModal(true)}
                                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 flex items-center justify-center gap-2 text-gray-500 hover:text-violet-400 hover:border-violet-500/50 transition"
                                                >
                                                    <Lock size={14} />
                                                    <span className="text-xs">محمي</span>
                                                </button>
                                            )
                                        ) : (
                                            isOrthoUnlocked ? (
                                                <div className="font-bold text-xl dir-ltr">
                                                    {patient.orthoTotalCost?.toLocaleString() || 0} <span className="text-xs font-normal opacity-50">IQD</span>
                                                    <div className="text-xs text-gray-500 mt-1">الواصل: {orthoTotalPaid.toLocaleString()}</div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowOrthoUnlockModal(true)}
                                                    className="flex items-center gap-2 text-gray-500 hover:text-violet-400 transition group"
                                                >
                                                    <Lock size={16} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-medium">محمي</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 block mb-1">الطبيب المشرف</label>
                                        {isEditingOrthoHeader ? (
                                            <select
                                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm outline-none focus:border-violet-500 text-white font-bold"
                                                value={editOrthoData.doctorId}
                                                onChange={e => setEditOrthoData({ ...editOrthoData, doctorId: e.target.value })}
                                            >
                                                {DOCTORS.map(d => (
                                                    <option
                                                        key={d.id}
                                                        value={d.id}
                                                        className="font-bold bg-gray-800"
                                                    >
                                                        {d.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">Dr</div>
                                                <span className={DOCTORS.find(d => d.id === patient.orthoDoctorId)?.textColor || 'text-white'}>
                                                    {DOCTORS.find(d => d.id === patient.orthoDoctorId)?.name || 'د. علي رياض'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Visit Form */}
                        <div className="bg-gray-800/60 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-gray-700">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Plus className="bg-gray-700 p-1 rounded-full text-gray-300" size={24} />
                                تسجيل زيارة شهرية
                            </h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    type="date"
                                    className="p-3 bg-gray-700/50 rounded-xl outline-none text-sm font-bold text-white border border-gray-600 focus:border-violet-500"
                                    value={orthoForm.visitDate}
                                    onChange={e => setOrthoForm({ ...orthoForm, visitDate: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Upper Arch (الفك العلوي)"
                                    className="p-3 bg-gray-700/50 rounded-xl outline-none text-sm text-white border border-gray-600 focus:border-violet-500 placeholder-gray-500"
                                    value={orthoForm.upperArch}
                                    onChange={e => setOrthoForm({ ...orthoForm, upperArch: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Lower Arch (الفك السفلي)"
                                    className="p-3 bg-gray-700/50 rounded-xl outline-none text-sm text-white border border-gray-600 focus:border-violet-500 placeholder-gray-500"
                                    value={orthoForm.lowerArch}
                                    onChange={e => setOrthoForm({ ...orthoForm, lowerArch: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {isOrthoUnlocked ? (
                                    <input
                                        type="number"
                                        placeholder="المبلغ الواصل"
                                        className="p-3 bg-gray-700/50 rounded-xl outline-none text-sm text-white border border-gray-600 focus:border-violet-500 dir-ltr placeholder-gray-500"
                                        value={orthoForm.paymentReceived}
                                        onChange={e => setOrthoForm({ ...orthoForm, paymentReceived: e.target.value })}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setShowOrthoUnlockModal(true)}
                                        className="p-3 bg-gray-700/30 rounded-xl border border-gray-600 flex items-center justify-center gap-2 text-gray-500 hover:text-violet-400 hover:border-violet-500/50 transition"
                                    >
                                        <Lock size={16} />
                                        <span className="text-sm">محمي</span>
                                    </button>
                                )}
                                <input
                                    type="text"
                                    placeholder="ملاحظات..."
                                    className="p-3 bg-gray-700/50 rounded-xl outline-none text-sm text-white border border-gray-600 focus:border-violet-500 placeholder-gray-500"
                                    value={orthoForm.notes}
                                    onChange={e => setOrthoForm({ ...orthoForm, notes: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={addOrthoVisit}
                                disabled={isSaving}
                                className="w-full bg-violet-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-600/20 active:scale-[0.98] transition hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'جاري الحفظ...' : 'حفظ الزيارة'}
                            </button>
                        </div>

                        {/* Visits List (Accordion) */}
                        <div className="space-y-3">
                            {patient.orthoVisits?.map((visit, idx) => (
                                <OrthoVisitItem
                                    key={visit.id}
                                    visit={visit}
                                    index={idx}
                                    totalVisits={patient.orthoVisits!.length}
                                    isExpanded={expandedVisitId === visit.id}
                                    onToggleExpand={setExpandedVisitId}
                                    onDelete={handleDeleteOrthoVisit}
                                    isOrthoUnlocked={isOrthoUnlocked}
                                />
                            ))}
                            {(!patient.orthoVisits || patient.orthoVisits.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    لا توجد زيارات مسجلة
                                </div>
                            )}
                        </div>
                    </div>
                )}


            </div>

            {/* X-ray Capture Modal - For New Procedure */}
            <XrayCaptureModal
                isOpen={showXrayCaptureModal && !xrayPaymentProcId}
                onClose={() => setShowXrayCaptureModal(false)}
                onCapture={handleCaptureXrayForNewProcedure}
                title="التقاط صورة أشعة"
            />

            {/* X-ray Capture Modal - For Payment */}
            <XrayCaptureModal
                isOpen={showXrayCaptureModal && !!xrayPaymentProcId}
                onClose={() => {
                    setShowXrayCaptureModal(false);
                    setXrayPaymentProcId(null);
                }}
                onCapture={handleCaptureXrayForPayment}
                title="التقاط صورة أشعة للدفعة"
            />

            {/* X-ray Viewer Modal */}
            <XrayViewerModal
                isOpen={showXrayViewerModal}
                onClose={() => setShowXrayViewerModal(false)}
                images={currentXrayImages}
            />

            {/* X-ray Payment Modal (Root Canal) */}
            <XrayPaymentModal
                isOpen={showXrayPaymentModal}
                onClose={() => {
                    setShowXrayPaymentModal(false);
                    setXrayPaymentProcId(null);
                    setXrayPaymentAmount('');
                }}
                onSkip={() => setShowXrayPaymentModal(false)}
                onCaptureXray={handlePaymentWithXray}
                paymentAmount={xrayPaymentAmount}
                onPaymentChange={setXrayPaymentAmount}
                onConfirmPayment={handlePaymentWithoutXray}
                isLoading={isSaving}
            />

            <DifficultyPrompt
                isOpen={difficultyPrompt.isOpen}
                context={difficultyPrompt.context}
                onClose={() => setDifficultyPrompt(prev => ({ ...prev, isOpen: false }))}
                onSubmit={() => setDifficultyPrompt(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
};
