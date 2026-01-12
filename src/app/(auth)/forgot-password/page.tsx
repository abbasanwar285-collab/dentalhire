// ============================================
// DentalHire - Forgot Password (OTP Flow)
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/shared';
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
    otp: z.string().min(6, 'Code must be 6 digits'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type OtpInput = z.infer<typeof otpSchema>;

export default function ForgotPasswordPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Email Form
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    // OTP Form
    const {
        register: registerOtp,
        handleSubmit: handleSubmitOtp,
        formState: { errors: otpErrors },
    } = useForm<OtpInput>({
        resolver: zodResolver(otpSchema),
    });

    const onSendCode = async (data: ForgotPasswordInput) => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseClient();
            // Using signInWithOtp instead of resetPasswordForEmail to avoid link/cookie issues
            // This sends a code that logs the user in, allowing them to verify and then update password
            const { error } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: { shouldCreateUser: false }
            });

            if (error) throw error;

            setEmail(data.email);
            setStep('otp');
        } catch (err: any) {
            console.error('Send OTP error:', err);
            if (err.message.includes('Signups not allowed')) {
                setError(language === 'ar' ? 'لا يوجد حساب بهذا البريد الإلكتروني' : 'No account found with this email');
            } else if (err.message.includes('rate limit')) {
                setError(language === 'ar' ? 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى' : 'Please wait a moment before trying again');
            } else {
                setError(err.message || 'Failed to send code');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const onVerifyCode = async (data: OtpInput) => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: data.otp,
                type: 'email',
            });

            if (error) throw error;

            // Success! Redirect to update password page
            router.push('/update-password');
        } catch (err: any) {
            console.error('Verify OTP error:', err);
            setError(language === 'ar' ? 'الرمز غير صحيح أو منتهي الصلاحية' : 'Invalid or expired code');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Logo / Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                        DH
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        Dental<span className="text-blue-600">Hire</span>
                    </span>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'ar'
                        ? (step === 'email' ? 'نسيت كلمة المرور؟' : 'إدخال رمز التحقق')
                        : (step === 'email' ? 'Forgot Password?' : 'Enter Verification Code')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                    {language === 'ar'
                        ? (step === 'email'
                            ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تسجيل الدخول.'
                            : `أرسلنا رمزاً مكوناً من 6 أرقام إلى ${email}`)
                        : (step === 'email'
                            ? 'Enter your email and we\'ll send you a login code.'
                            : `We sent a 6-digit code to ${email}`)}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {step === 'email' ? (
                <form onSubmit={handleSubmitEmail(onSendCode)} className="space-y-6">
                    <Input
                        label={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                        type="email"
                        placeholder="you@example.com"
                        leftIcon={<Mail size={18} />}
                        error={emailErrors.email?.message}
                        {...registerEmail('email')}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        loading={isLoading}
                        rightIcon={<ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
                    >
                        {language === 'ar' ? 'إرسال الرمز' : 'Send Code'}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleSubmitOtp(onVerifyCode)} className="space-y-6">
                    <Input
                        label={language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
                        type="text"
                        placeholder="123456"
                        leftIcon={<KeyRound size={18} />}
                        error={otpErrors.otp?.message}
                        {...registerOtp('otp')}
                        className="tracking-widest text-center text-lg"
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        loading={isLoading}
                    >
                        {language === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                        {language === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change Email'}
                    </button>
                </form>
            )}

            <div className="mt-8 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                    {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
            </div>
        </div>
    );
}
