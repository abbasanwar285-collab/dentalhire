import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/ui/Layout';
import { User, Bell, Shield, CircleHelp, ChevronLeft, LogOut, Smartphone, Database, Upload, Download, Check, AlertCircle, Moon, Banknote, FileText, Save, ClipboardList, Package, SlidersHorizontal, UsersRound, X, Wallet } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { exportClinicData, importClinicData, exportToCSV } from '../lib/export';

interface ImportResult {
  success: boolean;
  message: string;
}

export function Settings() {
  const { patients, appointments, treatments, doctors, clinicExpenses, clinicSettings, updateClinicSettings, tasks, supplyRequests } = useClinic();
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  const isSecretaryOrAssistant = currentUser?.role === 'secretary' || currentUser?.role === 'accountant';

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleExport = () => {
    exportClinicData(patients, appointments, treatments, doctors, clinicExpenses);
  };

  const handleExportCSV = () => {
    exportToCSV(patients);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await importClinicData(file);

      localStorage.setItem('clinic_patients', JSON.stringify(data.patients));
      localStorage.setItem('clinic_appointments', JSON.stringify(data.appointments));
      localStorage.setItem('clinic_treatments', JSON.stringify(data.treatments));
      localStorage.setItem('clinic_doctors', JSON.stringify(data.doctors));
      if (data.clinicExpenses) {
        localStorage.setItem('clinic_expenses', JSON.stringify(data.clinicExpenses));
      }

      setImportResult({
        success: true,
        message: `تم استيراد ${data.patients.length} مريض، ${data.appointments.length} موعد`
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد'
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Invoice settings state
  const [invoiceClinicName, setInvoiceClinicName] = useState(clinicSettings.clinicName || 'Iris Clinic');
  const [invoiceClinicPhone, setInvoiceClinicPhone] = useState(clinicSettings.clinicPhone || '');
  const [invoiceClinicAddress, setInvoiceClinicAddress] = useState(clinicSettings.clinicAddress || '');
  const [invoiceSettingsSaved, setInvoiceSettingsSaved] = useState(false);

  const handleSaveInvoiceSettings = () => {
    updateClinicSettings({
      clinicName: invoiceClinicName,
      clinicPhone: invoiceClinicPhone,
      clinicAddress: invoiceClinicAddress,
    });
    setInvoiceSettingsSaved(true);
    setTimeout(() => setInvoiceSettingsSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('هل أنت متأكد من مسح جميع بيانات العيادة؟ (لا يمكن التراجع عن هذا الإجراء)')) {
      // Preserve auth and settings
      const auth = localStorage.getItem('clinic_auth');
      const settings = localStorage.getItem('clinic_settings');
      const prefs = localStorage.getItem('clinic_display_prefs');
      
      localStorage.clear();
      
      if (auth) localStorage.setItem('clinic_auth', auth);
      if (settings) localStorage.setItem('clinic_settings', settings);
      if (prefs) localStorage.setItem('clinic_display_prefs', prefs);
      
      window.location.reload();
    }
  };

  // ── Restricted Settings view for secretary/assistant roles ──
  if (isSecretaryOrAssistant) {
    return (
      <Layout title="الإعدادات">
        <div className="space-y-6">
          {/* Profile card */}
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0071E3] to-[#AF52DE] flex items-center justify-center text-white font-bold text-[22px] shadow-lg">
              {currentUser?.displayName?.charAt(0) || 'د'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[20px] text-apple-text">{currentUser?.displayName}</h2>
              <p className="text-apple-text-secondary text-[14px] mt-0.5">@{currentUser?.username} · {currentUser?.role === 'secretary' ? 'سكرتارية' : 'محاسب'}</p>
            </div>
          </div>

          {/* Salary */}
          <div>
            <h3 className="text-[13px] font-semibold text-apple-text-secondary uppercase mb-2 px-1">المالية</h3>
            <div className="glass-card overflow-hidden">
              <button
                onClick={() => navigate('/settings/salary')}
                className="w-full flex items-center justify-between p-3.5 transition-colors active:bg-apple-fill cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-[#FF9500] text-white flex items-center justify-center shadow-sm">
                    <Banknote className="w-[16px] h-[16px]" />
                  </div>
                  <span className="text-[16px] font-medium text-apple-text">كم راتبي هذا الشهر 💰</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-apple-text-tertiary" />
              </button>
            </div>
          </div>

          {/* Dark / Light Mode */}
          <div>
            <h3 className="text-[13px] font-semibold text-apple-text-secondary uppercase mb-2 px-1">عام</h3>
            <div className="glass-card overflow-hidden">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-3.5 transition-colors active:bg-apple-fill cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-[#1c1c1e] text-white flex items-center justify-center shadow-sm">
                    <Moon className="w-[16px] h-[16px]" />
                  </div>
                  <span className="text-[16px] font-medium text-apple-text">الوضع الليلي (Dark Mode)</span>
                </div>
                <div className={`w-[51px] h-[31px] rounded-full transition-colors flex items-center px-0.5 ${isDarkMode ? 'bg-[#34C759]' : 'bg-[rgba(120,120,128,0.16)]'}`}>
                  <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-transform duration-300 ${isDarkMode ? '-translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full glass-card p-3.5 flex items-center justify-center gap-2 active:bg-apple-fill transition-all active:scale-[0.99]"
          >
            <LogOut className="w-[16px] h-[16px] text-[#FF3B30]" />
            <span className="text-[16px] text-[#FF3B30] font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </Layout>
    );
  }

  const settingsGroups = [
    {
      title: 'المالية',
      items: [
        ...(currentUser?.role === 'admin' ? [{ icon: Wallet, label: 'الإدارة المالية 💼', color: 'bg-[#34C759]', action: () => navigate('/settings/finance') }] : []),
        { icon: Banknote, label: 'كم راتبي هذا الشهر 💰', color: 'bg-[#FF9500]', action: () => navigate('/settings/salary') },
      ],
    },
    {
      title: 'إدارة الفريق',
      items: [
        ...(currentUser?.role === 'admin' ? [{ icon: Banknote, label: 'إدارة رواتب الموظفين', color: 'bg-[#FF2D55]', action: () => navigate('/settings/salaries-manage') }] : []),
        { icon: ClipboardList, label: `إدارة المهام ${tasks.filter(t => t.status === 'pending').length > 0 ? `(${tasks.filter(t => t.status === 'pending').length})` : ''}`, color: 'bg-[#5856D6]', action: () => navigate('/tasks') },
        { icon: Package, label: `المستلزمات المطلوبة ${supplyRequests.filter(r => r.status === 'pending').length > 0 ? `(${supplyRequests.filter(r => r.status === 'pending').length})` : ''}`, color: 'bg-[#FF9500]', action: () => navigate('/supply-requests') },
        { icon: UsersRound, label: 'ربط المساعدين بالأطباء', color: 'bg-[#AF52DE]', action: () => navigate('/settings/assistant-assignment') },
      ],
    },
    {
      title: 'عام',
      items: [
        { icon: SlidersHorizontal, label: 'تخصيص قائمة المرضى والملف الطبي', color: 'bg-[#0071E3]', action: () => navigate('/settings/display') },
        { icon: Moon, label: 'الوضع الليلي (Dark Mode)', color: 'bg-[#1c1c1e]', action: toggleDarkMode, isToggle: true, toggleValue: isDarkMode },
        { icon: Shield, label: 'الأمان والصلاحيات', color: 'bg-[#34C759]', action: () => navigate('/settings/security'), comingSoon: !hasPermission('manage_users') },
        { icon: Bell, label: 'الإشعارات', color: 'bg-[#FF3B30]', action: null, comingSoon: true },
      ],
    },
    {
      title: 'البيانات',
      items: [
        {
          icon: Download,
          label: 'نسخ احتياطي (JSON)',
          color: 'bg-[#0071E3]',
          action: handleExport
        },
        {
          icon: Download,
          label: 'تصدير المرضى (CSV)',
          color: 'bg-[#34C759]',
          action: handleExportCSV
        },
        {
          icon: Upload,
          label: 'استعادة نسخة احتياطية',
          color: 'bg-[#FF9F0A]',
          action: handleImportClick
        },
      ],
    },
    {
      title: 'الدعم',
      items: [
        { icon: CircleHelp, label: 'المساعدة والدعم', color: 'bg-[#AF52DE]', action: null },
        { icon: Smartphone, label: 'حول التطبيق', color: 'bg-[#86868B]', action: null },
      ],
    },
  ];

  return (
    <Layout title="الإعدادات">
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0071E3] to-[#AF52DE] flex items-center justify-center text-white font-bold text-[22px] shadow-lg">
            {currentUser?.displayName?.charAt(0) || 'د'}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[20px] text-apple-text">{currentUser?.displayName || 'د. أحمد'}</h2>
            <p className="text-apple-text-secondary text-[14px] mt-0.5">@{currentUser?.username} · {currentUser?.role === 'admin' ? 'مدير النظام' : currentUser?.role === 'doctor' ? 'طبيب' : currentUser?.role === 'secretary' ? 'سكرتارية' : 'محاسب'}</p>
            <p className="text-apple-text-tertiary text-[12px] mt-1">{patients.length} مريض · {appointments.length} موعد</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-apple-text-tertiary" />
        </div>

        {importResult && (
          <div className={`glass-card p-4 flex items-center gap-3 ${importResult.success
            ? 'bg-[#34C759]/10 border border-[#34C759]/20'
            : 'bg-[#FF3B30]/10 border border-[#FF3B30]/20'
            }`}>
            {importResult.success ? (
              <Check className="w-5 h-5 text-[#34C759]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#FF3B30]" />
            )}
            <p className={`text-[14px] ${importResult.success ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
              {importResult.message}
            </p>
          </div>
        )}

        {/* Invoice Settings Button */}
        <div>
          <h3 className="text-[13px] font-semibold text-apple-text-secondary uppercase mb-2 px-1">إعدادات الفاتورة</h3>
          <div className="glass-card overflow-hidden">
            <button
               onClick={() => setShowInvoiceModal(true)}
               className="w-full flex items-center justify-between p-3.5 transition-colors active:bg-apple-fill cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-[30px] h-[30px] rounded-[8px] bg-[#0071E3] text-white flex items-center justify-center shadow-sm">
                  <FileText className="w-[16px] h-[16px]" />
                </div>
                <span className="text-[16px] font-medium text-apple-text">تعديل معلومات الفاتورة</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-apple-text-tertiary" />
            </button>
          </div>
        </div>

        {settingsGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-[13px] font-semibold text-apple-text-secondary uppercase mb-2 px-1">{group.title}</h3>
            <div className="glass-card overflow-hidden">
              {group.items.map((item, itemIdx) => (
                <div key={itemIdx} className="relative">
                  <button
                    onClick={item.action || undefined}
                    disabled={!item.action}
                    className={`w-full flex items-center justify-between p-3.5 transition-colors ${item.action
                      ? 'active:bg-apple-fill cursor-pointer'
                      : 'cursor-default'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-[30px] h-[30px] rounded-[8px] ${item.color} text-white flex items-center justify-center`}>
                        <item.icon className="w-[16px] h-[16px]" />
                      </div>
                      <span className="text-[16px] text-apple-text">{item.label}</span>
                    </div>
                    {(item as any).isToggle ? (
                      <div className={`w-[51px] h-[31px] rounded-full transition-colors flex items-center px-0.5 ${(item as any).toggleValue ? 'bg-[#34C759]' : 'bg-[rgba(120,120,128,0.16)]'}`}>
                        <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-transform duration-300 ${(item as any).toggleValue ? '-translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    ) : (item as any).comingSoon ? (
                      <span className="text-[11px] text-apple-text-tertiary bg-apple-fill px-2 py-0.5 rounded-full">قريباً</span>
                    ) : (
                      item.action && <ChevronLeft className="w-4 h-4 text-apple-text-tertiary" />
                    )}
                  </button>
                  {itemIdx !== group.items.length - 1 && (
                    <div className="absolute bottom-0 right-[54px] left-4 h-[0.5px] bg-apple-separator" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full glass-card p-3.5 flex items-center justify-center gap-2 active:bg-apple-fill transition-all active:scale-[0.99]"
        >
          <Database className="w-[16px] h-[16px] text-[#FF3B30]" />
          <span className="text-[16px] text-[#FF3B30] font-medium">مسح البيانات نهائياً</span>
        </button>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowDeleteModal(false)}>
            <div className="absolute inset-0 bg-black/40 animate-fade-in" />
            <div className="relative bg-apple-bg rounded-2xl w-[280px] overflow-hidden animate-scale-in shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-[#FF3B30]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-[#FF3B30]" />
                </div>
                <h3 className="text-[17px] font-bold text-apple-text mb-1.5">مسح جميع البيانات</h3>
                <p className="text-[14px] text-apple-text-secondary leading-relaxed">سيتم حذف جميع بيانات المرضى والمواعيد نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="border-t border-apple-separator flex">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 text-[16px] font-semibold text-[#0071E3] active:bg-apple-fill transition-colors">إلغاء</button>
                <div className="w-[0.5px] bg-apple-separator" />
                <button onClick={handleClearData} className="flex-1 py-3 text-[16px] font-bold text-[#FF3B30] active:bg-apple-fill transition-colors">مسح</button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Settings Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowInvoiceModal(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl animate-scale-in overflow-hidden z-10 mb-16" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0071E3]" /> إعدادات الفاتورة
                </h3>
                <button title="إغلاق" onClick={() => setShowInvoiceModal(false)} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center transition-colors hover:bg-slate-300">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-500 mb-1 block">اسم العيادة</label>
                  <input
                    type="text"
                    value={invoiceClinicName}
                    onChange={(e) => setInvoiceClinicName(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all"
                    placeholder="اسم العيادة"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 mb-1 block">هاتف العيادة (اختياري)</label>
                  <input
                    type="tel"
                    value={invoiceClinicPhone}
                    onChange={(e) => setInvoiceClinicPhone(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all"
                    placeholder="07701234567"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-500 mb-1 block">عنوان العيادة (اختياري)</label>
                  <input
                    type="text"
                    value={invoiceClinicAddress}
                    onChange={(e) => setInvoiceClinicAddress(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[14px] outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] transition-all"
                    placeholder="المدينة - الحي"
                  />
                </div>
                <button
                  onClick={() => {
                     handleSaveInvoiceSettings();
                     setShowInvoiceModal(false);
                  }}
                  className="w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#0071E3] text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)] active:scale-[0.98] transition-transform"
                >
                  <Save className="w-4 h-4" /> حفظ وإغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={logout}
          className="w-full glass-card p-3.5 flex items-center justify-center gap-2 active:bg-apple-fill transition-all active:scale-[0.99]">
          <LogOut className="w-[16px] h-[16px] text-[#FF3B30]" />
          <span className="text-[16px] text-[#FF3B30] font-medium">تسجيل الخروج</span>
        </button>

        <p className="text-center text-[12px] text-apple-text-tertiary pb-4">
          عيادتي · الإصدار 1.0.0
        </p>
      </div>
    </Layout>
  );
}
