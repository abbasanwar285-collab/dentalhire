import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginInProgress, setAutoLoginInProgress] = useState(true);
  const autoLoginAttempted = useRef(false);

  // Auto-login from saved credentials — instant, no delay
  useEffect(() => {
    if (autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;

    const savedCreds = localStorage.getItem('clinic_saved_credentials');
    if (savedCreds) {
      try {
        const { username: savedUser, phone: savedPhone } = JSON.parse(savedCreds);
        if (savedUser && savedPhone) {
          const result = login(savedUser, savedPhone);
          if (!result.success) {
            // Credentials changed, clear saved and show form
            localStorage.removeItem('clinic_saved_credentials');
            setAutoLoginInProgress(false);
          }
          // If success, the component will unmount (isAuthenticated becomes true)
          return;
        }
      } catch {
        localStorage.removeItem('clinic_saved_credentials');
      }
    }
    setAutoLoginInProgress(false);
  }, [login]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = login(username, phone);
    if (!result.success) {
      setError(result.error || 'حدث خطأ');
    }
    setIsLoading(false);
  };

  // While auto-login is in progress, show nothing (blank) to avoid flashing the login form
  if (autoLoginInProgress) {
    return null;
  }

  return (
    <div
      className="login-page"
      dir="rtl"
    >
      {/* Logo */}
      <div className="login-logo">
        <Lock className="login-logo-icon" />
      </div>

      {/* Title */}
      <h1 className="login-title">إدارة العيادة</h1>
      <p className="login-subtitle">سجّل دخولك للمتابعة</p>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="login-form">
        {/* Username */}
        <div className="login-field">
          <label className="login-label">اسم المستخدم</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            placeholder="ادخل اسم المستخدم"
            autoComplete="username"
            autoFocus
          />
        </div>

        {/* Phone */}
        <div className="login-field">
          <label className="login-label">رقم الهاتف</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="login-input"
            placeholder="ادخل رقم الهاتف"
            autoComplete="tel"
            dir="ltr"
            style={{ textAlign: 'right' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <AlertCircle className="login-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !username || !phone}
          className="login-btn"
        >
          {isLoading ? (
            <div className="login-spinner" />
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>

      {/* Footer hint */}
      <p className="login-hint">
        استخدم البيانات المُقدمة من مدير العيادة
      </p>
    </div>
  );
}
