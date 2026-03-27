import React, { useState, useEffect } from 'react';
import { db, generateUUID } from '../services/db';
import { Expense } from '../types';
import { Trash2, DollarSign, Lock, LogIn, Calendar, PlusCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDoctorContext } from '../hooks/useDoctorContext';

export const Expenses: React.FC = () => {
    const navigate = useNavigate();
    const { currentDoctorId: _currentDoctorId } = useDoctorContext();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const auth = sessionStorage.getItem('expensesAuth');
        if (auth === 'true') {
            setIsAuthenticated(true);
            loadExpenses();
        }
    }, []);

    const loadExpenses = async () => {
        const data = await db.getExpenses();
        setExpenses(data);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === (import.meta.env.VITE_EXPENSES_PASSWORD || '1995')) {
            setIsAuthenticated(true);
            sessionStorage.setItem('expensesAuth', 'true');
            loadExpenses();
        } else {
            alert('كلمة المرور غير صحيحة');
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) {
            return;
        }

        setLoading(true);
        const newExpense: Expense = {
            id: generateUUID(),
            amount: parseFloat(amount),
            description,
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
        };

        await db.saveExpense(newExpense);
        await loadExpenses();
        setAmount('');
        setDescription('');
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الصرفية؟')) {
            await db.deleteExpense(id);
            loadExpenses();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-gray-700">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-rose-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">صرفيات محمد</h2>
                    <p className="text-gray-400 mb-8 text-sm">الرجاء إدخال كلمة المرور للمتابعة</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 border border-gray-600 bg-gray-700 rounded-xl text-center text-xl text-white tracking-widest focus:ring-2 focus:ring-rose-500 outline-none placeholder-gray-500"
                            placeholder="••••"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                        >
                            <LogIn size={20} />
                            دخول
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="min-h-screen bg-gray-900 pb-24 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white p-6 rounded-b-[2.5rem] shadow-lg mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition mr-2"
                        >
                            <ChevronRight size={24} />
                        </button>
                        <DollarSign className="w-8 h-8" />
                        صرفيات محمد
                    </h1>
                    <button
                        onClick={() => {
                            setIsAuthenticated(false);
                            sessionStorage.removeItem('expensesAuth');
                        }}
                        className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition backdrop-blur-sm"
                    >
                        <Lock size={20} />
                    </button>
                </div>

                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                    <p className="text-rose-100 text-sm mb-1">إجمالي الصرفيات</p>
                    <p className="text-4xl font-bold">{totalExpenses.toLocaleString()} <span className="text-lg font-normal opacity-80">د.ع</span></p>
                </div>
            </div>

            <div className="px-4 space-y-6">
                {/* Add Expense Form */}
                <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <PlusCircle className="text-rose-500" size={20} />
                        تسجيل صرفية جديدة
                    </h3>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">المبلغ</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 outline-none focus:ring-2 focus:ring-rose-500 font-bold text-lg placeholder-gray-500"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">نوع الصرفية</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 bg-gray-700/50 text-white rounded-xl border border-gray-600 outline-none focus:ring-2 focus:ring-rose-500 placeholder-gray-500"
                                placeholder="مثال: شراء مواد، غداء..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-rose-600 text-white p-3 rounded-xl font-bold hover:bg-rose-700 transition disabled:opacity-50 shadow-lg shadow-rose-600/20"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ الصرفية'}
                        </button>
                    </form>
                </div>

                {/* Expenses List */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-300 px-2">سجل الصرفيات</h3>
                    {expenses.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-3xl border border-dashed border-gray-700">
                            لا توجد صرفيات مسجلة
                        </div>
                    ) : (
                        expenses.map(expense => (
                            <div key={expense.id} className="bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-700 flex justify-between items-center group hover:border-rose-500/30 transition-all">
                                <div>
                                    <p className="font-bold text-white text-lg">{expense.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <Calendar size={12} />
                                        {expense.date}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-rose-500 text-lg">
                                        {expense.amount.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="text-gray-500 hover:text-rose-500 transition p-2 hover:bg-rose-500/10 rounded-full"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
