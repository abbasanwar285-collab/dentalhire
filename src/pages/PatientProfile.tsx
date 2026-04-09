import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClinic } from '../context/ClinicContext';
import {
  ChevronRight, ChevronDown, Phone, Calendar as CalendarIcon, Clock, Activity,
  FileText, AlertCircle, Save, Plus, History,
  Edit2, Trash2, User, Stethoscope, CreditCard,
  Wallet, AlertTriangle, Grid3X3, Heart,
  CheckCircle2, Timer, CircleDashed,
  Image, X, ZoomIn, Download, Share2, Maximize, UploadCloud
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { PatientForm } from '../components/forms/PatientForm';
import { DentalChart } from '../components/ui/DentalChart';
import { haptic } from '../lib/haptics';
import { getPatientLastVisit } from '../lib/patientUtils';
import { useAuth } from '../context/AuthContext';
import { buildInvoiceData, buildInvoiceHTML, printInvoice, shareInvoiceWhatsApp, InvoiceData } from '../lib/invoiceGenerator';



const accentColors = [
  { bg: '#0d9488', light: '#ccfbf1' },
  { bg: '#6366f1', light: '#e0e7ff' },
  { bg: '#f59e0b', light: '#fef3c7' },
  { bg: '#10b981', light: '#d1fae5' },
  { bg: '#ef4444', light: '#fee2e2' },
];

export function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, appointments, doctors, updatePatient, updateTreatmentPlan, deleteTreatmentPlan, deletePatient, arrivalRecords, clinicSettings } = useClinic();
  const { hasPermission, currentUser } = useAuth();

  // Permission helpers
  const canViewPrices = hasPermission('view_prices');
  const canViewOrthoPrices = hasPermission('view_ortho_prices');
  const canViewImplantPrices = hasPermission('view_implant_prices');
  const canViewPayments = hasPermission('view_payments');
  const canEditPayments = hasPermission('edit_payments');
  const canEditPlans = hasPermission('edit_treatment_plans');
  const canViewPlans = hasPermission('view_treatment_plans');
  const canEditPatients = hasPermission('edit_patients');
  const canDeletePatients = hasPermission('delete_patients');

  // Check if logged-in user is the doctor assigned to this plan
  const isOwnPlan = (plan: any) => {
    if (!currentUser) return false;
    const planDoctorId = plan.doctorId || plan.treatments?.[0]?.doctorId;
    const planDoctorName = plan.doctorName;
    const planDoctor = doctors.find(d => d.id === planDoctorId);
    // Match by doctor name against the user's display name
    const userName = (currentUser.displayName || '').replace('د. ', '').replace('د.', '').trim().toLowerCase();
    const docName = (planDoctorName || planDoctor?.name || '').replace('د. ', '').replace('د.', '').trim().toLowerCase();
    return userName !== '' && docName !== '' && (userName === docName || userName.includes(docName) || docName.includes(userName));
  };

  // Check if a plan's prices should be visible
  const canViewPlanPrices = (plan: any) => {
    // If user is the assigned doctor on this plan, they can always see its prices
    if (isOwnPlan(plan)) return true;
    // Otherwise, check general permissions
    if (!canViewPrices) return false;
    const isOrtho = !!plan.orthoDetails;
    const isImplant = plan.name?.includes('زراعة') || plan.treatments?.some((t: any) => t.treatmentType?.includes('زراعة') || t.treatmentType?.includes('Implant'));
    if (isOrtho && !canViewOrthoPrices) return false;
    if (isImplant && !canViewImplantPrices) return false;
    return true;
  };

  const patient = patients.find(p => p.id === id);
  const patientAppointments = appointments
    .filter(a => a.patientId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [medicalHistoryDraft, setMedicalHistoryDraft] = useState('');
  const [allergiesDraft, setAllergiesDraft] = useState('');
  const [bloodTypeDraft, setBloodTypeDraft] = useState('');
  const [paymentModal, setPaymentModal] = useState<{ planId: string, isOrtho?: boolean, orthoJaw?: string } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDoctorId, setPaymentDoctorId] = useState('');
  const [wireSizeUpper, setWireSizeUpper] = useState('');
  const [wireSizeLower, setWireSizeLower] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<{url: string, type: string, name: string} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [activePlanIdForUpload, setActivePlanIdForUpload] = useState<string | null>(null);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const [expandedPayments, setExpandedPayments] = useState<Record<string, boolean>>({});
  const [invoiceModal, setInvoiceModal] = useState<{ html: string; data: InvoiceData } | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);
  const location = useLocation();

  // Auto-scroll to latest treatment plan when coming from TreatmentPlanBuilder
  useEffect(() => {
    if (location.hash === '#latest-plan' && patient?.treatmentPlans?.length) {
      const latestPlan = patient.treatmentPlans[patient.treatmentPlans.length - 1];
      const timer = setTimeout(() => {
        const el = document.getElementById(`plan-${latestPlan.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease';
          el.style.boxShadow = '0 0 0 3px #0d9488, 0 0 20px rgba(13, 148, 136, 0.3)';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
        }
        window.history.replaceState(null, '', location.pathname);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [location.hash, patient?.treatmentPlans]);

  const allTreatments = patient?.treatmentPlans?.flatMap(plan =>
    (plan.treatments || []).map(t => ({
      ...t,
      planId: plan.id,
      planStatus: plan.status,
      planPaidAmount: plan.paidAmount,
      planTotalCost: plan.totalCost
    }))
  ) || [];

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  useEffect(() => {
    if (patient) {
      setNotesDraft(patient.generalNotes || '');
      setMedicalHistoryDraft(patient.medicalHistory || '');
      setAllergiesDraft(patient.allergies || '');
      setBloodTypeDraft(patient.bloodType || '');
    }
  }, [patient]);

  // Custom sorting logic for treatment plans:
  // 1. In-progress Ortho plans are always at the top.
  // 2. Then, other in-progress plans (newest first).
  // 3. Finally, all completed plans (newest first).
  const sortedTreatmentPlans = useMemo(() => {
    if (!patient?.treatmentPlans) return [];
    
    return [...patient.treatmentPlans].sort((a, b) => {
      const aIsCompleted = (a.paidAmount || 0) >= (a.totalCost || 0) && (a.totalCost || 0) > 0;
      const bIsCompleted = (b.paidAmount || 0) >= (b.totalCost || 0) && (b.totalCost || 0) > 0;
      
      const aIsOrtho = a.orthoDetails !== undefined || a.name?.includes('تقويم') || a.treatments?.some((t: any) => t.treatmentType?.includes('تقويم'));
      const bIsOrtho = b.orthoDetails !== undefined || b.name?.includes('تقويم') || b.treatments?.some((t: any) => t.treatmentType?.includes('تقويم'));

      // If one is completed and the other is not, the incomplete one comes first
      if (aIsCompleted && !bIsCompleted) return 1;
      if (!aIsCompleted && bIsCompleted) return -1;

      // Both are either incomplete or both are completed.
      // If incomplete, prioritize Ortho plans.
      if (!aIsCompleted && !bIsCompleted) {
        if (aIsOrtho && !bIsOrtho) return -1;
        if (!aIsOrtho && bIsOrtho) return 1;
      }

      // If both fall into the same category (both incomplete ortho, both incomplete non-ortho, or both completed),
      // sort by creation date descending (newest first).
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [patient?.treatmentPlans]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-600 text-lg mb-1">لم يتم العثور على المريض</p>
        <button onClick={() => navigate('/patients')} className="mt-4 text-teal-600 font-semibold">
          العودة لقائمة المرضى
        </button>
      </div>
    );
  }

  const age = patient.age || calculateAge(patient.dateOfBirth);
  const dynamicLastVisit = getPatientLastVisit(patient, appointments, arrivalRecords);
  const lastVisitDate = dynamicLastVisit ? parseISO(dynamicLastVisit) : null;

  const handleSaveNotes = () => {
    updatePatient(patient.id, { ...patient, generalNotes: notesDraft });
    setIsEditingNotes(false);
  };

  const handleSaveMedical = () => {
    updatePatient(patient.id, {
      ...patient,
      medicalHistory: medicalHistoryDraft,
      allergies: allergiesDraft,
      bloodType: bloodTypeDraft,
    });
    setIsEditingMedical(false);
  };

  const handleAddPayment = () => {
    if (!paymentModal || !paymentAmount) return;
    if (!paymentDoctorId) {
      alert('يجب اختيار الطبيب المستلم للمبلغ');
      return;
    }
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const plan = patient.treatmentPlans?.find(p => p.id === paymentModal.planId);
    if (!plan) return;

    const newPayment = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      amount,
      method: 'نقدي', // Default or implicitly cash since we removed the field
      notes: paymentNotes || undefined,
      wireSizeUpper: paymentModal.isOrtho && (paymentModal.orthoJaw === 'Upper' || paymentModal.orthoJaw === 'Both') && wireSizeUpper.trim() ? wireSizeUpper : undefined,
      wireSizeLower: paymentModal.isOrtho && (paymentModal.orthoJaw === 'Lower' || paymentModal.orthoJaw === 'Both') && wireSizeLower.trim() ? wireSizeLower : undefined,
      doctorId: paymentDoctorId || undefined,
    };

    const updatedPayments = [...(plan.payments || []), newPayment];
    const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    updateTreatmentPlan(patient.id, paymentModal.planId, {
      payments: updatedPayments,
      paidAmount: newPaidAmount,
    });

    setPaymentAmount('');
    setPaymentDoctorId('');
    setPaymentNotes('');
    setWireSizeUpper('');
    setWireSizeLower('');
    setPaymentModal(null);
  };

  const getStatusConfig = (status: string, paidAmount: number, totalCost: number) => {
    if (status === 'completed') return { label: 'مكتملة', color: '#10b981', bg: '#d1fae5' };
    if (paidAmount > 0 && paidAmount < totalCost) return { label: 'قيد التنفيذ', color: '#0ea5e9', bg: '#e0f2fe' };
    if (totalCost > 0 && paidAmount === 0) return { label: 'بانتظار الدفع', color: '#f59e0b', bg: '#fef3c7' };
    return { label: 'مخططة', color: '#64748b', bg: '#f1f5f9' };
  };

  const handleDeletePatient = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المريض نهائياً؟ هذا الإجراء سيرتب عليه حذف كل سجلاته الطبية والمواعيد ولن يمكن التراجع عنه.')) {
      deletePatient(patient.id);
      navigate('/patients', { replace: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activePlanIdForUpload) return;
    
    const plan = patient.treatmentPlans?.find(p => p.id === activePlanIdForUpload);
    if (!plan) return;

    const newAttachments = Array.from(e.target.files).map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    updateTreatmentPlan(patient.id, activePlanIdForUpload, {
      ...plan,
      attachments: [...(plan.attachments || []), ...newAttachments]
    });
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActivePlanIdForUpload(null);
  };

  const handleDeleteAttachment = (planId: string, attachmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;
    
    const plan = patient.treatmentPlans?.find(p => p.id === planId);
    if (!plan) return;

    updateTreatmentPlan(patient.id, planId, {
      ...plan,
      attachments: (plan.attachments || []).filter(a => a.id !== attachmentId)
    });
  };

  const totalCostAll = patient.treatmentPlans?.reduce((s, p) => s + (p.totalCost || 0), 0) || 0;
  const totalPaidAll = patient.treatmentPlans?.reduce((s, p) => s + (p.paidAmount || 0), 0) || 0;
  const activePlans = patient.treatmentPlans?.filter(p => p.status === 'in_progress').length || 0;

  const handleGenerateInvoice = (plan: any) => {
    setIsGeneratingInvoice(plan.id);
    try {
      const planDoctorId = plan.doctorId || plan.treatments?.[0]?.doctorId;
      const doctor = doctors.find(d => d.id === planDoctorId);
      const invoiceData = buildInvoiceData(plan, patient, doctor, clinicSettings);
      const html = buildInvoiceHTML(invoiceData);
      setInvoiceModal({ html, data: invoiceData });
      haptic.medium();
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('حدث خطأ أثناء إنشاء الفاتورة');
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-right pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600">
            <ChevronRight className="w-6 h-6" />
            <span className="text-lg font-medium">رجوع</span>
          </button>
          <h1 className="text-lg font-bold text-slate-800">الملف الطبي</h1>
          <div className="flex items-center gap-1">
            {canEditPatients && (
              <button onClick={() => setIsEditPatientModalOpen(true)} className="text-teal-600 p-2 rounded-xl hover:bg-teal-50" title="تعديل بيانات المريض">
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {canDeletePatients && (
              <button onClick={handleDeletePatient} className="text-red-500 p-2 rounded-xl hover:bg-red-50" title="حذف المريض نهائياً">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Patient Info Card */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="h-1.5 bg-gradient-to-r from-teal-500 to-teal-600" />
          
          {/* WhatsApp Action Button */}
          {patient.phone && (
            <div className="absolute top-4 left-4 z-10">
              <a
                href={`https://wa.me/${patient.phone.replace(/\D/g, '').replace(/^0/, '964')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-11 h-11 bg-[#25D366] text-white rounded-2xl shadow-lg shadow-[#25d366]/30 hover:bg-[#1ebd5a] transition-all hover:scale-105 active:scale-95"
                title="مراسلة عبر واتساب"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
            </div>
          )}

          <div className="p-5 pr-6 pl-16">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {patient.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{patient.phone}</span>
                  </a>
                  {age && <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{age} سنة</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center gap-2 overflow-x-auto">
            {lastVisitDate && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg shrink-0">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700">آخر زيارة: {formatDistanceToNow(lastVisitDate, { locale: ar, addSuffix: true })}</span>
              </div>
            )}
            {activePlans > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg shrink-0">
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">{activePlans} خطط نشطة</span>
              </div>
            )}
            {patient.allergies && patient.allergies.toLowerCase() !== 'لا يوجد' && (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-700">حساسية</span>
              </div>
            )}
          </div>
          
          {/* Medical History Note */}
          {patient.medicalHistory && (
             <div className="border-t border-slate-100 px-5 py-3 bg-rose-50/50">
               <div className="flex items-start gap-2.5">
                 <div className="mt-0.5 w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                   <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                 </div>
                 <div>
                   <h4 className="text-xs font-bold text-rose-700 mb-0.5">ملاحظات طبية</h4>
                   <p className="text-sm font-medium text-slate-700 leading-relaxed">{patient.medicalHistory}</p>
                 </div>
               </div>
             </div>
          )}

          {/* Financial Summary - only if user can view prices */}
          {canViewPrices && totalCostAll > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="min-w-0"><span className="text-xs text-slate-400 block">الإجمالي</span><span className="text-sm font-bold text-slate-800">{totalCostAll.toLocaleString()} د.ع</span></div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="min-w-0"><span className="text-xs text-emerald-500 block">المدفوع</span><span className="text-sm font-bold text-emerald-600">{totalPaidAll.toLocaleString()} د.ع</span></div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="min-w-0"><span className="text-xs text-amber-500 block">المتبقي</span><span className="text-sm font-bold text-amber-600">{(totalCostAll - totalPaidAll).toLocaleString()} د.ع</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Content */}
          <main className="p-4 space-y-4 content-container">
            {canEditPlans && (
              <button onClick={() => navigate(`/patients/${patient.id}/plan/new`)} className="w-full bg-teal-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-200">
                <Plus className="w-5 h-5" /> إضافة خطة علاج
              </button>
            )}

            {patient.treatmentPlans && patient.treatmentPlans.length > 0 ? (
              <div className="space-y-4">
                {sortedTreatmentPlans.map((plan, idx) => {
                  const computedTotalCost = (plan.totalCost || 0) > 0 ? plan.totalCost : (plan.treatments?.reduce((sum: number, t: any) => sum + (Number(t.cost || t.price) || 0), 0) || 0);
                  const computedPaidAmount = (plan.paidAmount || 0) > 0 ? plan.paidAmount : (plan.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount || p.payment) || 0), 0) || 0);

                  const canSeePrices = canViewPlanPrices(plan);
                  const isCompleted = canSeePrices ? (computedPaidAmount >= computedTotalCost && computedTotalCost > 0) : false;
                  const statusLabel = canSeePrices ? (isCompleted ? 'مكتملة' : 'قيد التنفيذ') : 'نشطة';
                  const statusBg = canSeePrices ? (isCompleted ? '#ecfdf5' : '#fffbeb') : '#f0fdf4';
                  const statusColor = canSeePrices ? (isCompleted ? '#059669' : '#d97706') : '#16a34a';
                  const progressColor = isCompleted ? '#059669' : '#d97706';
                  
                  const accent = accentColors[idx % accentColors.length];
                  const progress = canSeePrices && computedTotalCost > 0 ? (computedPaidAmount / computedTotalCost) * 100 : 0;
                  const remaining = canSeePrices ? computedTotalCost - computedPaidAmount : 0;
                  
                  const toothNumbers = plan.treatments?.map((t: any) => t.toothNumber).filter(Boolean) || [];
                  const planDoctorId = plan.doctorId || plan.treatments?.[0]?.doctorId;
                  const planDoctor = doctors.find(d => d.id === planDoctorId);
                  const docName = plan.doctorName || planDoctor?.name;
                  const docColor = planDoctor?.color || '#0d9488'; // Fallback to teal

                  // Mini tooth position graphic component
                  const ToothPositionBadge = ({ tooth, color }: { tooth: number; color: string }) => {
                    const quadrant = Math.floor(tooth / 10); // 1=UR, 2=UL, 3=LL, 4=LR
                    const isUpper = quadrant <= 2;
                    const isRight = quadrant === 1 || quadrant === 4;
                    
                    return (
                      <div className="flex flex-col items-center gap-0.5 shrink-0" title={`السن ${tooth}`}>
                        <div className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white">
                          {/* Cross lines */}
                          <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: color }} />
                          <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ backgroundColor: color }} />
                          {/* Tooth number in correct quadrant */}
                          <div className={cn(
                            "absolute flex items-center justify-center w-1/2 h-1/2",
                            isUpper && isRight && "top-0 right-0",
                            isUpper && !isRight && "top-0 left-0",
                            !isUpper && isRight && "bottom-0 right-0",
                            !isUpper && !isRight && "bottom-0 left-0"
                          )}>
                            <span className="text-[10px] font-black" style={{ color }}>{tooth}</span>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 leading-none">
                          {isUpper ? 'علوي' : 'سفلي'} {isRight ? 'يمين' : 'يسار'}
                        </span>
                      </div>
                    );
                  };

                  return (
                    <div
                      key={plan.id}
                      id={`plan-${plan.id}`}
                      className="rounded-2xl shadow-sm overflow-hidden"
                      style={{ 
                        backgroundColor: `${docColor}0F`, // Very light 6% tint 
                        border: `1.5px solid ${docColor}25`, 
                        borderRight: `4px solid ${docColor}` 
                      }}
                    >
                      <div className="h-1 opacity-60" style={{ background: `linear-gradient(to left, ${docColor}, ${docColor}40)` }} />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${docColor}20` }}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" style={{ color: docColor }} /> : <Timer className="w-5 h-5" style={{ color: docColor }} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{plan.name || plan.treatments?.[0]?.treatmentType || 'خطة'}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {plan.createdAt ? format(parseISO(plan.createdAt), 'dd MMMM yyyy', { locale: ar }) : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>{statusLabel}</span>
                        </div>

                        {/* Distinct Doctor Field Badge */}
                        {docName && (
                          <div className="flex items-center gap-2 mb-3 bg-white/70 backdrop-blur-sm p-2 rounded-xl border" style={{ borderColor: `${docColor}30` }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: docColor }}>
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5" style={{ color: `${docColor}90` }}>الطبيب المسؤول {plan.orthoDetails && "التقويم"}</span>
                              <span className="text-[14px] font-bold text-slate-800 leading-tight">د. {docName.replace('د. ', '').replace('د.', '').trim()}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Treatment Types List */}
                        {!plan.orthoDetails && plan.treatments && plan.treatments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {plan.treatments.map((t: any, tidx: number) => {
                              const typeName = t.treatmentType || t.name || 'إجراء طبي';
                              if (typeName === 'إجراء طبي' && plan.treatments.length === 1 && plan.name === 'علاج عام') return null; // Skip redundant defaults
                              return (
                                <span key={tidx} className="text-[11px] font-bold px-2 py-1.5 rounded-lg border shadow-sm" style={{ backgroundColor: '#ffffff', color: docColor, borderColor: `${docColor}30` }}>
                                  {typeName} {t.toothNumber ? `(سن ${t.toothNumber})` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Tooth Position Graphics */}
                        {!plan.orthoDetails && toothNumbers.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar pb-1">
                            {toothNumbers.map((tooth: number, tIdx: number) => (
                              <div key={tIdx}>
                                <ToothPositionBadge tooth={tooth} color={docColor} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ortho Specific Info */}
                        {plan.orthoDetails && (
                            <div className="border rounded-xl p-3 mb-3 text-xs grid grid-cols-2 gap-y-2 gap-x-3 bg-white/60 shadow-sm" style={{ borderColor: `${docColor}30` }}>
                                <div className="flex flex-col gap-0.5"><span className="font-semibold text-[10px] uppercase" style={{ color: `${docColor}A0` }}>الفك المعالج</span><span className="font-bold text-slate-800">{plan.orthoDetails.treatedJaw === 'Both' ? 'الفكين معاً' : plan.orthoDetails.treatedJaw === 'Upper' ? 'العلوي فقط' : 'السفلي فقط'}</span></div>
                                <div className="flex flex-col gap-0.5"><span className="font-semibold text-[10px] uppercase" style={{ color: `${docColor}A0` }}>التقويم</span><span className="font-bold text-slate-800">{plan.orthoDetails.applianceType === 'Fixed Metal' ? 'معدني ثابت' : plan.orthoDetails.applianceType === 'Clear' ? 'شفاف' : 'متحرك'}</span></div>
                                <div className="flex flex-col gap-0.5"><span className="font-semibold text-[10px] uppercase" style={{ color: `${docColor}A0` }}>الحالة</span><span className="font-bold text-slate-800">{plan.orthoDetails.caseType === 'Extraction Case' ? 'قلع' : 'بدون قلع'}</span></div>
                                <div className="flex flex-col gap-0.5"><span className="font-semibold text-[10px] uppercase" style={{ color: `${docColor}A0` }}>التوسع</span><span className="font-bold text-slate-800">{plan.orthoDetails.expansion ? 'نعم (Hyrax)' : 'لا'}</span></div>
                                <div className="col-span-2 flex flex-col gap-0.5 mt-1 border-t pt-2" style={{ borderColor: `${docColor}20` }}><span className="font-semibold text-[10px] uppercase" style={{ color: `${docColor}A0` }}>التشخيص</span><span className="font-bold text-slate-800 text-left" dir="ltr">{plan.orthoDetails.diagnosis}</span></div>
                            </div>
                        )}

                        {canViewPlanPrices(plan) && (
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 mb-3 border border-white">
                            <div className="flex justify-between text-xs mb-2"><span className="text-emerald-600">مدفوع: <strong>{computedPaidAmount.toLocaleString()}</strong></span><span className="text-slate-600">الإجمالي: <strong>{computedTotalCost.toLocaleString()}</strong></span></div>
                            <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: progressColor }} /></div>
                            {remaining > 0 && <p className="text-xs mt-2 text-amber-600 font-medium">متبقي: {remaining.toLocaleString()} د.ع</p>}
                          </div>
                        )}

                        {/* Attachments Toggle */}
                        <div className="mb-3 flex items-center gap-2">
                          {plan.attachments && plan.attachments.length > 0 ? (
                            <button
                              onClick={() => setExpandedAttachments(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                              className="flex-1 flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-500 active:scale-[0.98] transition-all"
                            >
                              <span className="flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-blue-400" />
                                المرفقات
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full leading-none">{plan.attachments.length}</span>
                              </span>
                              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", expandedAttachments[plan.id] && "rotate-180")} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActivePlanIdForUpload(plan.id);
                                setTimeout(() => fileInputRef.current?.click(), 0);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-slate-200 text-[11px] font-semibold text-slate-400 active:scale-[0.98] transition-all"
                            >
                              <Plus className="w-3 h-3" /> إضافة مرفقات
                            </button>
                          )}
                        </div>

                        {/* Collapsible Attachments Grid */}
                        {expandedAttachments[plan.id] && plan.attachments && plan.attachments.length > 0 && (
                          <div className="mb-3 overflow-hidden animate-slide-up">
                            <div className="flex items-center justify-end mb-1.5">
                              <button
                                onClick={() => {
                                  setActivePlanIdForUpload(plan.id);
                                  setTimeout(() => fileInputRef.current?.click(), 0);
                                }}
                                className="text-[10px] font-bold text-teal-600 active:scale-95 flex items-center gap-0.5 transition-all"
                              >
                                <Plus className="w-3 h-3" /> إضافة
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {plan.attachments.map((att, attIdx) => {
                                const isImage = att.type.startsWith('image/');
                                const ext = att.name.split('.').pop()?.toUpperCase() || 'FILE';
                                
                                return (
                                  <div
                                    key={att.id}
                                    className="relative rounded-lg border border-slate-200/80 bg-white overflow-hidden active:scale-[0.95] transition-transform"
                                  >
                                    <div
                                      className="aspect-square w-full cursor-pointer"
                                      onClick={() => isImage ? setViewingAttachment(att) : window.open(att.url, '_blank')}
                                    >
                                      {isImage ? (
                                        <img
                                          src={att.url}
                                          alt={`صورة ${attIdx + 1}`}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-blue-50', 'to-sky-100');
                                            const icon = document.createElement('div');
                                            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                                            target.parentElement!.appendChild(icon);
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/50 gap-0.5">
                                          <FileText className="w-4 h-4 text-blue-400" />
                                          <span className="text-[8px] font-bold text-blue-500">{ext}</span>
                                        </div>
                                      )}
                                    </div>
                                    {/* Delete button */}
                                    <button
                                      onClick={(e) => handleDeleteAttachment(plan.id, att.id, e)}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/40 text-white flex items-center justify-center active:scale-90 transition-all"
                                      title="حذف المرفق"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {canViewPlanPrices(plan) && (
                            <button
                              onClick={() => handleGenerateInvoice(plan)}
                              disabled={isGeneratingInvoice === plan.id}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm active:scale-[0.96] transition-all disabled:opacity-50"
                              title="إنشاء فاتورة"
                            >
                              {isGeneratingInvoice === plan.id ? (
                                <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              فاتورة
                            </button>
                          )}
                          {canEditPayments && canViewPlanPrices(plan) && (
                            <button onClick={() => {
                                // Auto-fill doctor: try to match logged-in user to a doctor
                                const userDisplayName = currentUser?.displayName?.replace('د. ', '').replace('د.', '').trim().toLowerCase() || '';
                                const matchedDoctor = doctors.find(d => d.name.replace('د. ', '').replace('د.', '').trim().toLowerCase() === userDisplayName);
                                setPaymentModal({ planId: plan.id, isOrtho: !!plan.orthoDetails, orthoJaw: plan.orthoDetails?.treatedJaw });
                                setPaymentDoctorId(matchedDoctor?.id || plan.doctorId || '');
                            }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-sm"><CreditCard className="w-4 h-4" /> {plan.orthoDetails ? 'جلسة' : 'دفعة'}</button>
                          )}
                          {canEditPlans && (
                            <>
                              <button onClick={() => navigate(`/patients/${patient.id}/plan/${plan.id}/edit`)} className="p-2.5 rounded-xl bg-slate-100 text-slate-600" title="تعديل"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => { if (confirm('حذف؟')) deleteTreatmentPlan(patient.id, plan.id); }} className="p-2.5 rounded-xl bg-red-50 text-red-500" title="حذف"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>

                        {/* Payment History Toggle - only if can view payments */}
                        {canViewPayments && canViewPlanPrices(plan) && plan.payments && plan.payments.length > 0 && (
                          <>
                            <button
                              onClick={() => setExpandedPayments(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                              className="mt-2 w-full flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px] font-semibold text-emerald-600 active:scale-[0.98] transition-all"
                            >
                              <span className="flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" />
                                سجل الدفعات
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full leading-none">{plan.payments.length}</span>
                              </span>
                              <ChevronDown className={cn("w-4 h-4 text-emerald-400 transition-transform duration-300", expandedPayments[plan.id] && "rotate-180")} />
                            </button>

                            {expandedPayments[plan.id] && (
                              <div className="mt-2 overflow-hidden animate-slide-up">
                                <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                                  {(() => {
                                    const pDoc = plan.doctorId || plan.treatments?.[0]?.doctorId;
                                    const dSet = new Set();
                                    if (pDoc) dSet.add(pDoc);
                                    plan.payments?.forEach(p => { if (p.doctorId) dSet.add(p.doctorId); });
                                    const hasMult = dSet.size > 1;

                                    return plan.payments.map((payment, payIdx) => {
                                      const actualDocId = payment.doctorId || pDoc;
                                      const docObj = doctors.find(d => d.id === actualDocId);
                                      const docName = docObj?.name || '';
                                      const docColor = docObj?.color || '#94a3b8';

                                      return (
                                        <div 
                                          key={payment.id} 
                                          className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                                          style={hasMult && docName ? { 
                                            backgroundColor: `${docColor}0F`, 
                                            boxShadow: `inset -3px 0 0 ${docColor}`
                                          } : {}}
                                        >
                                          <div 
                                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                            style={hasMult && docName ? { backgroundColor: `${docColor}1A` } : { backgroundColor: '#d1fae5' }}
                                          >
                                            <span 
                                              className="text-[10px] font-bold"
                                              style={hasMult && docName ? { color: docColor } : { color: '#047857' }}
                                            >{payIdx + 1}</span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[13px] font-bold text-slate-800">{(payment.amount || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-400">د.ع</span></span>
                                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                {format(parseISO(payment.date), 'dd/MM/yyyy', { locale: ar })}
                                              </span>
                                            </div>
                                            {hasMult && docName && (
                                              <div className="flex items-center gap-1 mt-1 mb-0.5 w-fit">
                                                <span 
                                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm"
                                                  style={{ 
                                                    backgroundColor: `${docColor}1A`, 
                                                    color: docColor,
                                                    border: `1px solid ${docColor}33`
                                                  }}
                                                >
                                                  <User className="w-3 h-3" style={{ color: docColor }} /> د. {docName}
                                                </span>
                                              </div>
                                            )}
                                        { (payment.wireSizeUpper || payment.wireSizeLower) && (
                                            <div className="flex gap-2 mt-1.5 mb-1.5">
                                                {payment.wireSizeUpper && <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-[0_1px_2px_rgba(59,130,246,0.1)]" dir="ltr">Upper: {payment.wireSizeUpper}</span>}
                                                {payment.wireSizeLower && <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 font-bold border border-sky-100 shadow-[0_1px_2px_rgba(14,165,233,0.1)]" dir="ltr">Lower: {payment.wireSizeLower}</span>}
                                            </div>
                                        )}
                                          {payment.notes && (
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{payment.notes}</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">لا توجد خطط علاجية</p>
              </div>
            )}
          </main>

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title={paymentModal?.isOrtho ? "تسجيل جلسة تقويم ودفعة" : "تسجيل دفعة"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">المبلغ المالي (د.ع)</label>
            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="المبلغ (د.ع)" />
          </div>

          {paymentModal?.isOrtho && (paymentModal.orthoJaw === 'Upper' || paymentModal.orthoJaw === 'Both') && (
            <div>
              <label className="text-xs font-bold text-blue-600 mb-1.5 block">قياس السلك العلوي (Wire Size Upper)</label>
              <input type="text" value={wireSizeUpper} onChange={(e) => setWireSizeUpper(e.target.value)} className="w-full p-3 bg-white border border-blue-200 shadow-sm rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold" placeholder="e.g. 0.014 NiTi" dir="ltr" />
            </div>
          )}

          {paymentModal?.isOrtho && (paymentModal.orthoJaw === 'Lower' || paymentModal.orthoJaw === 'Both') && (
            <div>
              <label className="text-xs font-bold text-sky-600 mb-1.5 block">قياس السلك السفلي (Wire Size Lower)</label>
              <input type="text" value={wireSizeLower} onChange={(e) => setWireSizeLower(e.target.value)} className="w-full p-3 bg-white border border-sky-200 shadow-sm rounded-xl text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-semibold" placeholder="e.g. 0.016 SS" dir="ltr" />
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label className="text-xs font-bold text-red-500 mb-1.5 block">الطبيب المستلم للمبلغ *</label>
            <div className="relative">
              <select
                value={paymentDoctorId}
                onChange={(e) => setPaymentDoctorId(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all appearance-none pr-10"
                dir="rtl"
              >
                <option value="">-- اختيار الطبيب --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>د. {doc.name}</option>
                ))}
              </select>
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">يُحسب من راتب ونسبة هذا الطبيب إذا تم تحديده.</p>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-600 mb-1.5 block">الملاحظات (اختياري)</label>
             <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className="w-full p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm resize-none min-h-[100px] outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="ملاحظات الجلسة (اختياري)" />
          </div>

          <button onClick={handleAddPayment} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-semibold shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all">
            {paymentModal?.isOrtho ? 'حفظ الجلسة' : 'تسجيل الدفعة'}
          </button>
        </div>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal isOpen={isEditPatientModalOpen} onClose={() => setIsEditPatientModalOpen(false)} title="تعديل بيانات المريض">
        <PatientForm onSubmit={(data) => { updatePatient(patient.id, { ...patient, ...data }); setIsEditPatientModalOpen(false); }} onCancel={() => setIsEditPatientModalOpen(false)} initialData={patient} />
      </Modal>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        title="اختيار ملف"
      />

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 p-4 sm:p-8 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = viewingAttachment.url;
                link.download = viewingAttachment.name;
                link.click();
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md"
              title="تنزيل"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewingAttachment(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative w-full max-w-5xl max-h-full flex items-center justify-center">
            {viewingAttachment.type.startsWith('image/') ? (
              <img
                src={viewingAttachment.url}
                alt={viewingAttachment.name}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-sm w-full">
                <FileText className="w-16 h-16 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2 truncate w-full" dir="ltr">{viewingAttachment.name}</h3>
                <p className="text-sm text-slate-500 mb-6">لا يمكن معاينة هذا النوع من الملفات مباشرة</p>
                <button
                  onClick={() => window.open(viewingAttachment.url, '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30"
                >
                  فتح الملف
                </button>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/60 backdrop-blur-md rounded-full border border-white/10 text-white/90 text-sm font-medium shadow-xl truncate max-w-[90vw]" dir="ltr">
            {viewingAttachment.name}
          </div>
        </div>
      )}

      {/* Invoice Actions Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setInvoiceModal(null)}>
          <div 
            className="bg-white rounded-3xl shadow-2xl w-[90vw] max-w-[360px] shrink-0 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-inner">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">فاتورة العلاج</h3>
              <p className="text-sm text-slate-500 mb-2">المريض: {invoiceModal.data.patientName}</p>
              <div className="px-3 py-1 bg-blue-100/50 text-blue-700 rounded-full text-xs font-bold font-mono">
                {invoiceModal.data.invoiceNumber}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white space-y-3">
              <button
                onClick={() => {
                  haptic.medium();
                  shareInvoiceWhatsApp(invoiceModal.data, patient.phone);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#25d366]/30 active:scale-[0.98] transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                إرسال عبر واتساب
              </button>

              <button
                onClick={() => {
                  haptic.light();
                  printInvoice(invoiceModal.data);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                عرض و طباعة الفاتورة (PDF)
              </button>
              
              <button
                onClick={() => setInvoiceModal(null)}
                className="w-full py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
