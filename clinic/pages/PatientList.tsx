import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Smile, Trash2, Loader2, Lock, Filter, Clock, DollarSign, CheckCircle, Calendar, UserCheck, X, ChevronDown, RefreshCw } from 'lucide-react';
import { db, subscribeToDataChanges } from '../services/db';
import { Patient, TreatmentType, DOCTORS } from '../types';
import { PasswordModal } from '../components/PasswordModal';

// Memoized Patient Card Component
const PatientCard = React.memo(({
  patient,
  activeTab,
  isDeleting,
  onDelete,
  onClick
}: {
  patient: Patient;
  activeTab: 'general' | 'ortho';
  isDeleting: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onClick: (id: string) => void;
}) => {
  // Calculate Debt Status
  const procCost = (patient.procedures || []).reduce((sum, p) => sum + (p.price || 0), 0);
  const orthoCost = patient.orthoTotalCost || 0;
  const total = procCost + orthoCost;

  const procPaid = (patient.procedures || []).reduce((sum, proc) =>
    sum + (proc.payments || []).reduce((pSum, pay) => pSum + (pay.amount || 0), 0)
    , 0);
  const orthoPaid = (patient.orthoVisits || []).reduce((sum, v) => sum + (v.paymentReceived || 0), 0);
  const legacyPaid = (patient.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const paid = procPaid + orthoPaid + legacyPaid;

  const remaining = total - paid;
  const hasDebt = remaining > 0;

  return (
    <div
      onClick={() => !isDeleting && onClick(patient.id)}
      className={`bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-700 hover:border-violet-500/50 transition-all cursor-pointer relative group overflow-hidden ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${hasDebt ? 'bg-rose-500' : 'bg-emerald-500'}`} />

      <div className="flex justify-between items-start pr-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`p-3 rounded-full transition-colors shrink-0 ${activeTab === 'ortho' ? 'bg-violet-500/10 text-violet-400' : (hasDebt ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400')}`}>
            {activeTab === 'ortho' ? <Smile size={24} /> : <User size={24} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-gray-100 mb-1 truncate">{patient.name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              <span className="shrink-0">العمر: {patient.age} سنة {patient.gender === 'Male' ? '(ذكر)' : patient.gender === 'Female' ? '(أنثى)' : ''}</span>
              {patient.mobile && (
                <span className="flex items-center gap-1 shrink-0">
                  {patient.mobile}
                </span>
              )}
            </div>
            {patient.diagnosis && (
              <p className="text-xs text-violet-300 font-medium mt-1 truncate max-w-[200px]">
                {patient.diagnosis}
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {patient.orthoDiagnosis && (
                <span className="inline-block text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20 whitespace-nowrap">
                  ملف تقويم
                </span>
              )}
              {hasDebt && (
                <span className="inline-block text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20 whitespace-nowrap">
                  مديون
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="font-bold text-gray-500 text-sm">
            #{patient.id.slice(-3).toUpperCase()}
          </span>
          <button
            onClick={(e) => onDelete(e, patient.id)}
            disabled={isDeleting}
            className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors z-10"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
});

export const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [_loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'ortho'>('general');
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'debt' | 'completed'>('all');

  // Advanced Filters State
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Security State
  const [isOrthoUnlocked, setIsOrthoUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unlocked = localStorage.getItem('ortho_unlocked') === 'true';
    if (unlocked) {
      setIsOrthoUnlocked(true);
    }
  }, []);

  const handleOrthoTabClick = () => {
    if (isOrthoUnlocked) {
      setActiveTab('ortho');
    } else {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSuccess = () => {
    setIsOrthoUnlocked(true);
    localStorage.setItem('ortho_unlocked', 'true');
    setActiveTab('ortho');
    setShowPasswordModal(false);
  };

  const loadPatients = useCallback(async () => {
    // 1. Try Local Cache (Instant)
    try {
      const parsed = await db.getLocalPatients();
      if (parsed && parsed.length > 0) {
        setPatients(parsed);
        setLoading(false);
      }
    } catch (e) {
      console.error('Local load error', e);
    }

    // 2. Network Fetch (Fresh)
    const data = await db.getPatients();
    setPatients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial load
    loadPatients();

    // Subscribe to realtime changes
    const unsubscribe = subscribeToDataChanges('patients', () => {
      loadPatients();
    });

    return () => {
      unsubscribe();
    };
  }, [loadPatients]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('تحذير: هل أنت متأكد من حذف هذا المريض نهائياً؟\n\nسيتم حذف الملف الطبي، خطط العلاج، والمواعيد المرتبطة به. لا يمكن التراجع عن هذا الإجراء.');

    if (confirmDelete) {
      setDeletingId(id);
      try {
        await db.deletePatient(id);
        setPatients(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Delete error:', error);
        alert('حدث خطأ أثناء محاولة الحذف. يرجى التأكد من إعدادات قاعدة البيانات أو المحاولة مرة أخرى.');
      } finally {
        setDeletingId(null);
      }
    }
  }, []);

  const handleCardClick = useCallback((id: string) => {
    navigate(`/patient/${id}`);
  }, [navigate]);

  // مريض التقويم = مسجل تحت د. علي رياض + لديه بيانات تقويم
  const isOrthoPatient = (p: Patient) => {
    // يجب أن يكون مسجل تحت د. علي رياض
    const isUnderDrAli = p.orthoDoctorId === 'dr_ali';
    if (!isUnderDrAli) {
      return false;
    }

    // ويجب أن يكون لديه بيانات تقويم فعلية
    const hasOrthoDiagnosis = !!(p.orthoDiagnosis && p.orthoDiagnosis.trim().length > 0);
    const hasOrthoVisits = !!(p.orthoVisits && p.orthoVisits.length > 0);
    const hasOrthoCost = !!(p.orthoTotalCost && p.orthoTotalCost > 0);

    return hasOrthoDiagnosis || hasOrthoVisits || hasOrthoCost;
  };

  const isGeneralPatient = (p: Patient) => {
    const hasNonOrthoProcedures = p.procedures.some(proc => proc.type !== TreatmentType.ORTHO);
    const hasOrthoProcedure = p.procedures.some(proc => proc.type === TreatmentType.ORTHO);
    const hasNoProcedures = p.procedures.length === 0;
    return hasNonOrthoProcedures || (hasOrthoProcedure && !isOrthoPatient(p)) || (hasNoProcedures && !isOrthoPatient(p));
  };

  const orthoPatients = patients.filter(isOrthoPatient);
  const generalPatients = patients.filter(isGeneralPatient);
  // Filter Logic Helpers
  const isToday = (val?: string | number) => {
    if (!val) {
      return false;
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (typeof val === 'string' && val.includes('-')) {
      return val.startsWith(todayStr);
    }

    const date = new Date(val);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getPatientDebt = (p: Patient) => {
    // Revert to calculating from procedures to ensure accuracy with current DB state
    const procCost = (p.procedures || []).reduce((sum, pr) => sum + (pr.price || 0), 0);
    const orthoCost = p.orthoTotalCost || 0;
    const total = procCost + orthoCost;

    const procPaid = (p.procedures || []).reduce((sum, proc) =>
      sum + (proc.payments || []).reduce((pSum, pay) => pSum + (pay.amount || 0), 0)
      , 0);
    const orthoPaid = (p.orthoVisits || []).reduce((sum, v) => sum + (v.paymentReceived || 0), 0);
    const legacyPaid = (p.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const paid = procPaid + orthoPaid + legacyPaid;

    return total - paid;
  };

  const currentList = activeTab === 'ortho' ? orthoPatients : generalPatients;

  const filteredPatients = currentList.filter(p => {
    // 1. Text Search
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (
      p.name.toLowerCase().includes(term) ||
      (p.mobile && p.mobile.includes(term)) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(term))
    );
    if (!matchesSearch) {
      return false;
    }

    // 2. Advanced Filters
    // 2a. Doctor Filter
    if (selectedDoctor) {
      const hasMatchingDoctor = p.procedures.some(proc => proc.doctorId === selectedDoctor) ||
        p.orthoDoctorId === selectedDoctor;
      if (!hasMatchingDoctor) {
        return false;
      }
    }

    // 2b. Date Range Filter
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;

      // Check if patient has any activity in date range
      const createdDate = new Date(p.createdAt);
      const updatedDate = p.updatedAt ? new Date(p.updatedAt) : null;
      const procDates = p.procedures.map(proc => new Date(proc.date));
      const visitDates = (p.orthoVisits || []).map(v => new Date(v.visitDate));
      const allDates = [createdDate, updatedDate, ...procDates, ...visitDates].filter(Boolean) as Date[];

      const inRange = allDates.some(d => {
        if (fromDate && d < fromDate) {
          return false;
        }
        if (toDate && d > toDate) {
          return false;
        }
        return true;
      });

      if (!inRange) {
        return false;
      }
    }

    // 3. Filter Mode (Only applies to General Tab usually, but user said "All Patients section")
    if (activeTab === 'general' && filterMode !== 'all') {
      if (filterMode === 'today') {
        const createdToday = isToday(p.createdAt);
        const updatedToday = isToday(p.updatedAt);
        const hasProcedureToday = p.procedures.some(proc => isToday(proc.date));
        const hasOrthoVisitToday = p.orthoVisits?.some(v => isToday(v.visitDate));

        // Check for payments today
        const hasProcedurePaymentToday = p.procedures.some(proc =>
          proc.payments?.some(pay => isToday(pay.date) || isToday(pay.timestamp))
        );
        const hasLegacyPaymentToday = p.payments?.some(pay =>
          isToday(pay.date) || isToday(pay.timestamp)
        );

        if (!createdToday && !updatedToday && !hasProcedureToday && !hasOrthoVisitToday && !hasProcedurePaymentToday && !hasLegacyPaymentToday) {
          return false;
        }
      } else if (filterMode === 'debt') {
        if (getPatientDebt(p) <= 0) {
          return false;
        }
      } else if (filterMode === 'completed') {
        // Completed = No Debt (and maybe has history?)
        // Let's assume just "Fully Paid" for now as per "Completed" vs "Debtors" contrast
        if (getPatientDebt(p) > 0) {
          return false;
        }
      }
    }

    return true;
  });


  const handleRefresh = async () => {
    setLoading(true);
    (window as any)._forceSync = true;
    await loadPatients();
    setLoading(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Sub-Header / Title (Optional but good for context) */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">سجل المرضى</h2>
            <p className="text-gray-400 text-[10px]">إدارة ملفات المراجعين</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 bg-gray-800/40 text-gray-400 hover:text-white hover:bg-violet-600/20 rounded-xl transition-all active:scale-95"
          title="تحديث البيانات"
        >
          <RefreshCw size={20} className={_loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="ابحث عن مريض..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pr-12 bg-gray-800/60 backdrop-blur-md text-white rounded-2xl border border-gray-700 focus:ring-2 focus:ring-violet-500 outline-none placeholder-gray-500 transition-all shadow-sm"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition border ${showAdvancedFilters ? 'bg-violet-600 text-white border-violet-500' : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-white'}`}
        >
          <Filter size={16} />
          بحث متقدم
          <ChevronDown size={14} className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </button>

        {(selectedDoctor || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSelectedDoctor('');
              setDateFrom('');
              setDateTo('');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition"
          >
            <X size={14} />
            إعادة تعيين
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-700 space-y-4 animate-in slide-in-from-top">
          {/* Doctor Filter */}
          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-1">
              <UserCheck size={14} />
              الطبيب المعالج
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
            >
              <option value="">كل الأطباء</option>
              {DOCTORS.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-1">
                <Calendar size={14} />
                من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-1">
                <Calendar size={14} />
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Filters (Only for General Tab) */}
      {activeTab === 'general' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${filterMode === 'all'
              ? 'bg-gray-700 text-white border-gray-600'
              : 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
          >
            <Filter size={14} />
            الكل
          </button>
          <button
            onClick={() => setFilterMode('today')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${filterMode === 'today'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
          >
            <Clock size={14} />
            اليوم
          </button>
          <button
            onClick={() => setFilterMode('debt')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${filterMode === 'debt'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
          >
            <DollarSign size={14} />
            مديونين
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${filterMode === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-gray-800/40 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
          >
            <CheckCircle size={14} />
            مكتملين
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-800/60 backdrop-blur-md p-1 rounded-2xl border border-gray-700">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 p-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'general'
            ? 'bg-violet-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          كل المراجعين ({generalPatients.length})
        </button>
        <button
          onClick={handleOrthoTabClick}
          className={`flex-1 p-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'ortho'
            ? 'bg-violet-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          {activeTab !== 'ortho' && !isOrthoUnlocked && <Lock size={14} className="opacity-70" />}
          مرضى التقويم ({orthoPatients.length})
        </button>
      </div>

      {/* Patient List */}
      <div className="space-y-3 pb-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-3xl border border-dashed border-gray-700">
            <p>لا يوجد مرضى مطابقين للبحث</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              activeTab={activeTab}
              isDeleting={deletingId === patient.id}
              onDelete={handleDelete}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};
