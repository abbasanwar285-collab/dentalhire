
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, UserPlus, Edit, Wallet, X, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { db, generateUUID } from '../services/db';
import { Patient } from '../types';
import { patientSchema } from '../types/validation';

// Consultation Fee Modal Component
interface ConsultationFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  feeAmount: number;
  currentCount: number;
}

const ConsultationFeeModal: React.FC<ConsultationFeeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  feeAmount,
  currentCount
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl border border-violet-500/30 animate-[fadeIn_0.2s_ease-out]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          title="Close modal"
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Wallet size={32} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          تأكيد دفع الكشفية
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-center mb-4">
          هل تريد تسجيل دفع مبلغ الكشفية؟
        </p>

        {/* Fee Amount Display */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">مبلغ الكشفية</span>
            <span className="text-2xl font-bold text-violet-400">{feeAmount} د.ع</span>
          </div>
          {currentCount > 0 && (
            <div className="mt-2 pt-2 border-t border-violet-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">الكشفيات المدفوعة سابقاً</span>
                <span className="text-violet-300">{currentCount} كشفية</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5">
          <AlertCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            سيتم إضافة هذا المبلغ إلى سجل المريض. يمكنك دفع كشفية جديدة عند كل مراجعة.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-700/50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            تأكيد الدفع
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get ID from URL if editing
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id); // True if editing, need to load data first
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [consultationFeeCount, setConsultationFeeCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    mobile: '',
    notes: '',
    diagnosis: '',
    consultationFeePaid: false // Will be true if count > 0
  });

  const CONSULTATION_FEE = 5; // 5 IQD

  // Load patient data if editing
  useEffect(() => {
    if (id) {
      const loadPatient = async () => {
        try {
          const patient = await db.getPatientById(id);
          if (patient) {
            setFormData({
              name: patient.name || '',
              age: patient.age !== null && patient.age !== undefined ? patient.age.toString() : '',
              mobile: patient.mobile || '',
              notes: patient.notes || '',
              diagnosis: patient.diagnosis || '',
              consultationFeePaid: patient.consultationFeePaid || false
            });
            setConsultationFeeCount(patient.consultationFeeCount || (patient.consultationFeePaid ? 1 : 0));
          } else {
            alert('لم يتم العثور على المريض');
            navigate(-1);
          }
        } catch (error) {
          console.error('Error loading patient:', error);
          alert('خطأ في تحميل بيانات المريض');
        } finally {
          setInitialLoading(false);
        }
      };
      loadPatient();
    }
  }, [id, navigate]);

  const handlePayConsultationFee = () => {
    setShowFeeModal(true);
  };

  const handleConfirmPayment = () => {
    setConsultationFeeCount(prev => prev + 1);
    setFormData(prev => ({ ...prev, consultationFeePaid: true }));
    setShowFeeModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = patientSchema.safeParse({
      name: formData.name,
      age: formData.age, // Zod coerces this
      mobile: formData.mobile,
      notes: formData.notes,
      diagnosis: formData.diagnosis
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const errorMessage = firstError ? firstError.message : 'بيانات غير صحيحة';
      alert(errorMessage);
      return;
    }

    setLoading(true);

    try {
      if (id) {
        // --- EDIT MODE ---
        const existingPatient = await db.getPatientById(id);
        if (existingPatient) {
          const updatedPatient: Patient = {
            ...existingPatient,
            name: formData.name,
            age: parseInt(formData.age),
            mobile: formData.mobile,
            notes: formData.notes,
            diagnosis: formData.diagnosis,
            consultationFeePaid: consultationFeeCount > 0,
            consultationFeeCount: consultationFeeCount
          };
          await db.savePatient(updatedPatient);
          setLoading(false);
          navigate(`/patient/${id}`); // Go back to details
        }
      } else {
        // --- CREATE MODE ---
        // Check for duplicate patients (Name only)
        const existingPatients = await db.getPatients();
        const duplicate = existingPatients.find(p =>
          p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
        );

        if (duplicate) {
          setLoading(false);
          const confirmed = window.confirm(
            `⚠️ تنبيه: المريض موجود مسبقاً!\n\n` +
            `الاسم: ${duplicate.name}\n` +
            `العمر: ${duplicate.age} سنة\n` +
            `${duplicate.mobile ? `الموبايل: ${duplicate.mobile}\n` : ''}` +
            `\nسبب التطابق: الاسم\n\n` +
            `هل تريد الانتقال إلى ملفه الطبي؟`
          );

          if (confirmed) {
            navigate(`/patient/${duplicate.id}`);
          }
          return;
        }

        const newPatient: Patient = {
          id: generateUUID(),
          name: formData.name,
          age: parseInt(formData.age),
          mobile: formData.mobile,
          notes: formData.notes,
          diagnosis: formData.diagnosis,
          consultationFeePaid: consultationFeeCount > 0,
          consultationFeeCount: consultationFeeCount,
          createdAt: Date.now(),
          procedures: [],
          orthoVisits: [], // Ensure these are initialized
          payments: [],
          scans: [], // Ensure this is present
          totalCost: 0,
          paidAmount: 0 // Initialize to 0
        };

        await db.savePatient(newPatient);
        // Force sync on next load to ensure list is updated
        (window as any)._forceSync = true;

        setLoading(false);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      setLoading(false);
      alert('حدث خطأ أثناء حفظ البيانات: ' + (error.message || 'خطأ غير معروف'));
    }
  };

  // Show loading spinner while fetching patient data in edit mode
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
            className="p-2 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition"
          >
            <ChevronRight size={24} />
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {id ? <Edit className="text-violet-500" /> : <UserPlus className="text-violet-500" />}
            {id ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">اسم المريض (مطلوب)</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white placeholder-gray-500"
              placeholder="مثال: أحمد محمد"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">العمر (مطلوب)</label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white placeholder-gray-500"
              placeholder="مثال: 30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">رقم الموبايل</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white placeholder-gray-500"
              placeholder="07XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none h-24 resize-none bg-gray-700/50 text-white placeholder-gray-500"
              placeholder="حالة عامة، أمراض مزمنة..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">التشخيص</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700/50 text-white placeholder-gray-500"
              placeholder="التشخيص الحالي للمريض..."
            />
          </div>

          {/* Consultation Fee Button */}
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 rounded-xl border border-violet-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-violet-400" />
                <span className="font-medium text-violet-300">دفع الكشفية ({CONSULTATION_FEE} د.ع)</span>
              </div>
              {consultationFeeCount > 0 && (
                <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">{consultationFeeCount} كشفية</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePayConsultationFee}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Wallet size={18} />
              {consultationFeeCount > 0 ? 'دفع كشفية أخرى' : 'دفع الكشفية'}
            </button>

            {consultationFeeCount > 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">
                المجموع المدفوع: {consultationFeeCount * CONSULTATION_FEE} د.ع
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label="Save patient data"
            title="Save patient data"
            className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-violet-700 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-violet-600/20"
          >
            <Save size={20} />
            {loading ? 'جاري الحفظ...' : (id ? 'حفظ التعديلات' : 'حفظ البيانات')}
          </button>
        </form>
      </div>

      {/* Consultation Fee Modal */}
      <ConsultationFeeModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        onConfirm={handleConfirmPayment}
        feeAmount={CONSULTATION_FEE}
        currentCount={consultationFeeCount}
      />
    </>
  );
};
