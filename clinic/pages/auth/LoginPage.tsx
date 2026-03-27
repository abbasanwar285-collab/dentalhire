import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, Loader2, AlertCircle, Activity } from 'lucide-react';
import { authService } from '../../services/auth';

const LoginPage = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        console.log('[Login] Attempting login for:', phone);

        try {
            // 1. Try standard login
            await authService.signIn(phone, password);
            console.log('[Login] Success, navigating to home');
            navigate('/');
        } catch (err: any) {
            console.error('[Login] Login failed:', err);

            // 2. Auto-Registration Logic
            // If login fails but user is in allowed_users, we silently register them
            if (err.message && (err.message.includes('Invalid login credentials') || err.message.includes('not found') || err.message.includes('invalid_grant'))) {
                try {
                    console.log('[Login] User might be missing from Auth. Checking allowed_users...');
                    // Check if they are authorized
                    const isAllowed = await authService.checkAllowedUser(phone);

                    if (isAllowed) {
                        console.log('[Login] User found in allowed_users. Auto-registering...');
                        // Auto-register
                        await authService.signUp(phone, password, isAllowed.name, isAllowed.role);
                        await authService.signIn(phone, password); // Login immediately after
                        console.log('[Login] Auto-registration success. Navigating...');
                        navigate('/');
                        return;
                    }
                } catch (regError: any) {
                    console.error('[Login] Auto-registration failed:', regError);
                    if (regError.message && regError.message.includes('rate limit')) {
                        setError('يرجى الانتظار قليلاً والمحاولة مجدداً');
                        return;
                    }
                }
            }

            // Show error if auto-reg didn't work
            if (err.message && (err.message.includes('مهلة') || err.message.includes('TIMEOUT'))) {
                setError(err.message);
            } else {
                setError('رقم الهاتف أو كلمة المرور غير صحيحة');
            }
        } finally {
            console.log('[Login] Cleanup loading state');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="flex justify-center mb-8">
                        <div className="bg-violet-600 p-4 rounded-2xl shadow-lg shadow-violet-600/30 transform rotate-3">
                            <Activity size={32} className="text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-2">تسجيل الدخول</h2>
                    <p className="text-center text-gray-400 mb-8 text-sm">أدخل رقم هاتفك وكلمة المرور للمتابعة</p>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-500/20">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
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
                            <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute top-3 right-3 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 outline-none transition"
                                    placeholder="******"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
