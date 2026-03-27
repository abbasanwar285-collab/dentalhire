import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { db, subscribeToDataChanges } from '../../services/db';
import { AllowedUser } from '../../types';
import { authService } from '../../services/auth';

const StaffManagement = () => {
    const [staff, setStaff] = useState<AllowedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newPhone, setNewPhone] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'doctor' | 'assistant'>('doctor');
    const [adding, setAdding] = useState(false);

    const fetchStaff = async () => {
        // 1. Try Local cache FIRST (Instant display)
        try {
            const cached = await db.getLocalStaff();
            if (cached !== null) {
                // We have a cache (even if empty array) - show it immediately
                setStaff(cached);
                setLoading(false);
                console.log('[StaffManagement] Loaded from cache:', cached.length, 'items');
            }
        } catch (e) {
            console.error('[StaffManagement] Cache read error:', e);
        }

        // 2. Network Fetch in background (don't block UI)
        try {
            console.log('[StaffManagement] Fetching from network...');
            const data = await db.getStaff();
            console.log('[StaffManagement] Network returned:', data.length, 'items');
            setStaff(data);
            setError(null);
        } catch (err: any) {
            console.error('[StaffManagement] Network fetch error:', err?.message || err);
            // Only show error if we have NO data at all
            if (staff.length === 0) {
                setError('فشل تحميل قائمة الموظفين من الشبكة');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();

        // Subscribe to changes
        const unsubscribe = subscribeToDataChanges('staff', () => {
            fetchStaff();
        });

        return () => unsubscribe();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError(null);

        try {
            const email = authService.formatEmail(newPhone);
            const newUser: AllowedUser = {
                email: email,
                name: newName,
                role: newRole,
                created_at: new Date().toISOString()
            };

            await db.saveStaff(newUser);

            setNewPhone('');
            setNewName('');
            setNewRole('doctor');
            // List will update via subscription
        } catch (err: any) {
            console.error('Error adding staff:', err);
            setError(err.message || 'فشل إضافة الموظف');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (email: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟ لن يتمكن من تسجيل الدخول مرة أخرى.')) {
            return;
        }

        try {
            await db.deleteStaff(email);
            // List will update via subscription
        } catch (err: any) {
            console.error('Error deleting staff:', err);
            alert('فشل حذف المستخدم');
        }
    };

    // Helper to display phone without domain
    const displayPhone = (email: string) => {
        return email.replace('@clinic.com', '').replace('@clinic.local', '');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-white mb-8">إدارة الموظفين والصلاحيات</h1>

                {/* Add Staff Form */}
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <UserPlus className="text-violet-500" />
                        إضافة موظف جديد
                    </h2>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm border border-red-500/20">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">الاسم</label>
                            <div className="relative">
                                <User className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="اسم الموظف"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="07700000000"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">الصلاحية</label>
                            <div className="relative">
                                <Shield className="absolute top-3 right-3 text-gray-500" size={18} />
                                <select
                                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none appearance-none cursor-pointer"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as any)}
                                >
                                    <option value="doctor">طبيب (Doctor)</option>
                                    <option value="assistant">مساعد (Assistant)</option>
                                    <option value="admin">مدير (Admin)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={adding}
                            className="bg-violet-600 text-white py-2.5 px-6 rounded-xl font-bold hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-70 h-[46px] shadow-lg shadow-violet-600/20"
                        >
                            {adding ? <Loader2 className="animate-spin w-5 h-5" /> : 'إضافة'}
                        </button>
                    </form>
                </div>

                {/* Staff List */}
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-white">قائمة الموظفين المصرح لهم</h2>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-violet-500" size={32} />
                                <p>جاري التحميل...</p>
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">لا يوجد موظفين مضافين حالياً</div>
                        ) : (
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">الاسم</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">رقم الهاتف</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">الصلاحية</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">تاريخ الإضافة</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {staff.map((user) => (
                                        <tr key={user.email} className="hover:bg-gray-700/50 transition duration-150">
                                            <td className="px-6 py-4 text-white font-medium">{user.name || '-'}</td>
                                            <td className="px-6 py-4 text-gray-300 font-mono" dir="ltr">{displayPhone(user.email)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                                                    ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        user.role === 'doctor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(user.created_at).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(user.email)}
                                                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition"
                                                    title="إزالة الصلاحية"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
