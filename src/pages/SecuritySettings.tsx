import { useState } from 'react';
import { Layout } from '../components/ui/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, Shield, ChevronLeft, Edit2, Trash2, 
  ToggleLeft, ToggleRight, Save, X, Users, Eye, EyeOff, 
  ArrowRight, Palette
} from 'lucide-react';
import { UserRole, UserPermissions, DEFAULT_PERMISSIONS, AppUser } from '../types';
import { useNavigate } from 'react-router-dom';

const DOCTOR_COLORS = [
  '#0071E3', '#FF2D55', '#FF9500', '#0d9488', '#6366f1',
  '#ec4899', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b',
  '#3b82f6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  secretary: 'سكرتارية',
  accountant: 'محاسب',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#ef4444',
  doctor: '#3b82f6',
  secretary: '#8b5cf6',
  accountant: '#f59e0b',
};

interface PermissionItem {
  key: keyof UserPermissions;
  label: string;
  group: string;
}

const PERMISSION_ITEMS: PermissionItem[] = [
  { key: 'view_patients', label: 'عرض قائمة المرضى', group: 'المرضى' },
  { key: 'edit_patients', label: 'إضافة/تعديل المرضى', group: 'المرضى' },
  { key: 'delete_patients', label: 'حذف المرضى', group: 'المرضى' },
  { key: 'view_appointments', label: 'عرض المواعيد', group: 'المواعيد' },
  { key: 'edit_appointments', label: 'إضافة/تعديل/حذف المواعيد', group: 'المواعيد' },
  { key: 'view_treatment_plans', label: 'عرض الخطط العلاجية', group: 'العلاجات' },
  { key: 'edit_treatment_plans', label: 'إنشاء/تعديل الخطط العلاجية', group: 'العلاجات' },
  { key: 'view_prices', label: 'عرض أسعار العلاجات', group: 'الأسعار' },
  { key: 'view_ortho_prices', label: 'عرض أسعار التقويم', group: 'الأسعار' },
  { key: 'view_implant_prices', label: 'عرض أسعار الزراعة', group: 'الأسعار' },
  { key: 'view_payments', label: 'عرض المدفوعات والأرصدة', group: 'المالية' },
  { key: 'edit_payments', label: 'تسجيل دفعات جديدة', group: 'المالية' },
  { key: 'view_indicators', label: 'الوصول لصفحة المؤشرات', group: 'النظام' },
  { key: 'view_dashboard', label: 'الوصول للشاشة الرئيسية والملخصات', group: 'النظام' },
  { key: 'customize_dashboard', label: 'تخصيص عرض القائمة الرئيسية (الداشبورد)', group: 'النظام' },
  { key: 'view_settings', label: 'الوصول للإعدادات', group: 'النظام' },
  { key: 'purchase_supplies', label: 'شراء المستلزمات (تأكيد الشراء)', group: 'المستلزمات' },
];

export function SecuritySettings() {
  const navigate = useNavigate();
  const { users, currentUser, addUser, updateUser, deleteUser, toggleUserActive } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('secretary');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS.secretary);
  const [formColor, setFormColor] = useState('#0071E3');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formError, setFormError] = useState('');
  
  // Salary State
  const [formSalaryType, setFormSalaryType] = useState<'none' | 'fixed' | 'percentage' | 'both'>('none');
  const [formFixedSalary, setFormFixedSalary] = useState<number>(0);
  const [formPercentage, setFormPercentage] = useState<number>(0);
  const [formSalaryStartDate, setFormSalaryStartDate] = useState<number>(1);

  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormPhone('');
    setFormRole('secretary');
    setFormPermissions(DEFAULT_PERMISSIONS.secretary);
    setFormColor('#0071E3');
    setFormSpecialization('');
    setFormSalaryType('none');
    setFormFixedSalary(0);
    setFormPercentage(0);
    setFormSalaryStartDate(1);
    setFormError('');
    setShowAddForm(false);
    setEditingUser(null);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions({ ...DEFAULT_PERMISSIONS[role] });
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setFormPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!formName.trim() || !formUsername.trim() || !formPhone.trim()) {
      setFormError('يرجى ملء جميع الحقول');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        displayName: formName,
        username: formUsername,
        phone: formPhone,
        role: formRole,
        permissions: formPermissions,
        color: (formRole === 'doctor' || formRole === 'admin') ? formColor : undefined,
        specialization: (formRole === 'doctor' || formRole === 'admin') ? formSpecialization : undefined,
        salaryType: formSalaryType,
        fixedSalary: formFixedSalary,
        percentage: formPercentage,
        salaryStartDate: formSalaryStartDate,
      });
      resetForm();
    } else {
      const result = addUser({
        displayName: formName,
        username: formUsername,
        phone: formPhone,
        role: formRole,
        permissions: formPermissions,
        isActive: true,
        color: (formRole === 'doctor' || formRole === 'admin') ? formColor : undefined,
        specialization: (formRole === 'doctor' || formRole === 'admin') ? formSpecialization : undefined,
        salaryType: formSalaryType,
        fixedSalary: formFixedSalary,
        percentage: formPercentage,
        salaryStartDate: formSalaryStartDate,
      });
      if (!result.success) {
        setFormError(result.error || 'حدث خطأ');
        return;
      }
      resetForm();
    }
  };

  const startEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.displayName);
    setFormUsername(user.username);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormPermissions({ ...user.permissions });
    setFormColor(user.color || '#0071E3');
    setFormSpecialization(user.specialization || '');
    setFormSalaryType(user.salaryType || 'none');
    setFormFixedSalary(user.fixedSalary || 0);
    setFormPercentage(user.percentage || 0);
    setFormSalaryStartDate(user.salaryStartDate || 1);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    setShowDeleteConfirm(null);
  };

  // Group permissions by group name
  const permissionGroups = PERMISSION_ITEMS.reduce<Record<string, PermissionItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  if (currentUser?.role !== 'admin') {
    return (
      <Layout title="الأمان والصلاحيات">
        <div className="empty-state">
          <Shield className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg font-semibold">لا تملك صلاحية الوصول</p>
          <p className="text-slate-400 text-sm mt-1">فقط المدير يمكنه إدارة المستخدمين</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="الأمان والصلاحيات" subtitle="إدارة المستخدمين">
      <div className="space-y-4 pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-teal-600 font-semibold mb-2"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع للإعدادات
        </button>

        {/* Header Stats */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{users.length} مستخدم</p>
                <p className="text-xs text-slate-500">{users.filter(u => u.isActive).length} نشط</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddForm(true); }}
              className="apple-btn apple-btn-primary text-sm !py-2 !px-4 !min-h-0"
            >
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="glass-card p-5 animate-slide-up space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-800">
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاسم الظاهر</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="apple-input text-sm"
                placeholder="مثال: د. سارة أحمد"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">اسم المستخدم</label>
              <input
                type="text"
                value={formUsername}
                onChange={e => setFormUsername(e.target.value)}
                className="apple-input text-sm"
                placeholder="مثال: dr.sara"
                dir="ltr"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">رقم الهاتف (للدخول)</label>
              <input
                type="tel"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                className="apple-input text-sm"
                placeholder="07xxxxxxxxx"
                dir="ltr"
              />
            </div>

            {/* Role */}
            {formRole !== 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">الدور</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['doctor', 'secretary', 'accountant'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all border-2 ${
                        formRole === role
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-transparent bg-slate-50 text-slate-600'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor-specific fields */}
            {(formRole === 'doctor' || formRole === 'admin') && (
              <>
                {/* Specialization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">الاختصاص</label>
                  <input
                    type="text"
                    value={formSpecialization}
                    onChange={e => setFormSpecialization(e.target.value)}
                    className="apple-input text-sm"
                    placeholder="مثال: أخصائية تقويم"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">
                    <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> لون الطبيب في التطبيق</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOCTOR_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormColor(color)}
                        className="w-9 h-9 rounded-xl transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: color,
                          boxShadow: formColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                          transform: formColor === color ? 'scale(1.1)' : 'scale(1)',
                        }}
                        title={color}
                      >
                        {formColor === color && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Salary Details */}
            <div className="glass-card p-4 space-y-4 !rounded-xl bg-slate-50/50">
              <h4 className="text-[13px] font-bold text-slate-700">تفاصيل الراتب (اختياري)</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">نوع الراتب</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'بدون' },
                    { id: 'fixed', label: 'راتب ثابت' },
                    { id: 'percentage', label: 'نسبة من الوارد' },
                    { id: 'both', label: 'راتب + نسبة' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormSalaryType(type.id as any)}
                      className={`p-2 rounded-lg text-[11px] font-bold text-center transition-all border-2 ${
                        formSalaryType === type.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner'
                          : 'border-transparent bg-white shadow-sm text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {(formSalaryType === 'fixed' || formSalaryType === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">مبلغ الراتب الثابت (شهرياً)</label>
                  <input
                    type="number"
                    min="0"
                    value={formFixedSalary || ''}
                    onChange={e => setFormFixedSalary(Number(e.target.value))}
                    className="apple-input text-sm"
                    placeholder="مثال: 500000"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">المبلغ الشهري الإجمالي الذي يتقاضاه الموظف</p>
                </div>
              )}

              {(formSalaryType === 'percentage' || formSalaryType === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">نسبة الوارد (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formPercentage || ''}
                      onChange={e => setFormPercentage(Number(e.target.value))}
                      className="apple-input text-sm pr-8"
                      placeholder="مثال: 15"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">نسبة الطبيب تحسب من الجلسات المنجزة، بينما الإداري تحسب من إيراد العيادة</p>
                </div>
              )}

              {/* Salary Start Date */}
              {formSalaryType !== 'none' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">يوم بدء العد للراتب</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formSalaryStartDate || ''}
                    onChange={e => setFormSalaryStartDate(Number(e.target.value))}
                    className="apple-input text-sm"
                    placeholder="مثال: 1"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">اليوم من الشهر الذي تبدأ فيه دورة الراتب (مثلاً 1 لبداية الشهر)</p>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-3">الصلاحيات التفصيلية</label>
              <div className="space-y-4">
                {Object.entries(permissionGroups).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 px-1">{group}</p>
                    <div className="glass-card overflow-hidden !rounded-xl">
                      {items.map((item, idx) => (
                        <div key={item.key} className="relative">
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                              {formPermissions[item.key] ? (
                                <Eye className="w-4 h-4 text-teal-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-slate-300" />
                              )}
                              <span className="text-sm text-slate-700">{item.label}</span>
                            </div>
                            <button
                              onClick={() => togglePermission(item.key)}
                              className="transition-colors"
                            >
                              {formPermissions[item.key] ? (
                                <ToggleRight className="w-10 h-6 text-teal-500" />
                              ) : (
                                <ToggleLeft className="w-10 h-6 text-slate-300" />
                              )}
                            </button>
                          </div>
                          {idx !== items.length - 1 && (
                            <div className="absolute bottom-0 right-4 left-4 h-[0.5px] bg-apple-separator" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {formError && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{formError}</p>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              className="w-full apple-btn apple-btn-primary"
            >
              <Save className="w-5 h-5" />
              {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
            </button>
          </div>
        )}

        {/* Users List */}
        <div>
          <h3 className="text-sm font-bold text-slate-600 uppercase mb-2 px-1">المستخدمون</h3>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className={`glass-card p-4 transition-all ${!user.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm"
                    style={{ backgroundColor: user.role === 'doctor' ? (user.color || '#3b82f6') : ROLE_COLORS[user.role] }}
                  >
                    {user.displayName.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{user.displayName}</h4>
                      {!user.isActive && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">معطّل</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      @{user.username} · <span style={{ color: user.role === 'doctor' ? (user.color || '#3b82f6') : ROLE_COLORS[user.role] }}>{ROLE_LABELS[user.role]}</span>
                      {user.role === 'doctor' && user.specialization && <span className="text-slate-400"> · {user.specialization}</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  {user.role !== 'admin' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleUserActive(user.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}
                        title={user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      >
                        {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(user)}
                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full font-bold">مدير</span>
                      <button
                        onClick={() => startEdit(user)}
                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                        title="تعديل الإعدادات"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
            <div className="absolute inset-0 bg-black/40 animate-fade-in" />
            <div className="relative bg-white rounded-2xl w-[280px] overflow-hidden animate-scale-in shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">حذف المستخدم</h3>
                <p className="text-sm text-slate-500">هل أنت متأكد من حذف هذا المستخدم نهائياً؟</p>
              </div>
              <div className="border-t border-slate-200 flex">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 text-base font-semibold text-blue-600 active:bg-slate-50">إلغاء</button>
                <div className="w-[0.5px] bg-slate-200" />
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-3 text-base font-bold text-red-500 active:bg-slate-50">حذف</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
