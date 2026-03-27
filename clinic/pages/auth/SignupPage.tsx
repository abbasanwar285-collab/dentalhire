import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth';

const SignupPage = () => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Role is now determined by the backend based on phone whitelist
            // We pass 'doctor' as a dummy, but backend trigger ignores it or validates it
            await authService.signUp(phone, password, fullName, 'doctor');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message.includes('Email not authorized') || err.message.includes('Database error saving new user'))) {
                setError('رقم الهاتف هذا غير مصرح له بالتسجيل، أو حدث خطأ في النظام. تأكد من أن رقمك مضاف مسبقاً من قبل المسؤول.');
            } else {
                setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-violet-600 p-3 rounded-2xl shadow-lg shadow-violet-600/30">
                            <CheckCircle2 size={32} className="text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-2">تفعيل الحساب</h2>
                    <p className="text-center text-gray-400 mb-8 text-sm">أدخل رقم هاتفك وكلمة مرور جديدة لتفعيل حسابك</p>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-500/20">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="الاسم الثلاثي"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="07700000000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Lock className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="******"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 mr-1">يجب أن تكون 6 أحرف على الأقل</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'تفعيل الحساب والدخول'}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                            لديك حساب مفعل بالفعل؟{' '}
                            <Link to="/login" className="text-violet-400 font-bold hover:text-violet-300 hover:underline transition">
                                تسجيل الدخول
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
