import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Calendar, Activity, PieChart, Lock, FileText, Brain, Sparkles, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { db, subscribeToDataChanges } from '../services/db';
import { DOCTORS } from '../types';
import { AIInsightsModal } from '../components/AIInsightsModal';
import { AIFinancialInsights } from '../components/AIFinancialInsights';
import { Preferences } from '@capacitor/preferences';

export const Stats: React.FC = () => {
  const navigate = useNavigate();
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    // Check if already unlocked from persistent storage
    const checkUnlocked = async () => {
      const { value } = await Preferences.get({ key: 'clinic_stats_access' });
      if (value === 'true') {
        setLocked(false);
      }
    };
    checkUnlocked();
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const localStats = await db.getLocalStats();
      if (localStats && localStats.totalRevenueExpected > 0) {
        setStats(localStats);
      }
    } catch (e) {
      console.error('Failed to load local stats:', e);
    }
    const data = await db.getStats();
    setStats(data);
  }, []);

  useEffect(() => {
    if (!locked) {
      loadStats();
      const unsubPatients = subscribeToDataChanges('patients', loadStats);
      const unsubAppointments = subscribeToDataChanges('appointments', loadStats);
      const unsubExpenses = subscribeToDataChanges('expenses', loadStats);
      return () => {
        unsubPatients(); unsubAppointments(); unsubExpenses();
      };
    }
  }, [locked, loadStats]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0005') {
      // Save to persistent storage so it remembers across app restarts
      await Preferences.set({ key: 'clinic_stats_access', value: 'true' });
      setLocked(false);
    } else {
      setError(true);
    }
  };

  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-6">
        <div className="bg-gray-800/60 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-gray-700">
          <div className="bg-violet-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-violet-500">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">المؤشرات الحيوية</h2>
          <p className="text-gray-400 text-sm mb-6">بيانات العيادة المالية محمية.</p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password" placeholder="رمز المرور" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 text-center text-xl tracking-widest rounded-xl border border-gray-600 focus:ring-2 focus:ring-violet-500 outline-none bg-gray-700 text-white"
              maxLength={4} autoFocus
            />
            {error && <div className="text-rose-500 text-xs font-bold">رمز خاطئ</div>}
            <button type="submit" className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-violet-700 transition">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3"></div>
        <p className="text-sm">جاري التحليل...</p>
      </div>
    );
  }

  const orthoPercent = Math.round((stats?.totalOrthoRevenue || 0) / (stats?.orthoExpectedRevenue || 1) * 100);

  return (
    <div className="space-y-3 animate-fade-in pb-20">
      <AIInsightsModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
            <Activity size={18} />
          </div>
          <h2 className="text-lg font-bold text-white">لوحة المؤشرات</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAIModalOpen(true)} className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition">
            <Brain size={16} />
          </button>
          <button onClick={() => navigate('/doctor-stats')} className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition" title="إحصائيات الأطباء">
            <Users size={16} />
          </button>
          <button onClick={() => navigate('/reports')} className="p-2 rounded-xl bg-gray-700 text-gray-400 hover:text-white transition">
            <FileText size={16} />
          </button>
        </div>
      </div>

      {/* AI Financial Advisor */}
      {
        stats && (
          <AIFinancialInsights
            revenue={stats.totalPaid || 0}
            expenses={stats.totalExpenses || 0}
            profit={(stats.totalPaid || 0) - (stats.totalExpenses || 0)}
            topProcedures={Object.entries(stats.treatmentStats || {})
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 5)
              .map(([name, revenue]: any) => ({ name, revenue }))}
            doctorPerformance={DOCTORS.map(doc => ({
              name: doc.name,
              revenue: stats.doctorStats?.[doc.id] || 0
            })).sort((a, b) => b.revenue - a.revenue)}
          />
        )
      }

      {/* Main Revenue */}
      <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 p-4 rounded-2xl border border-violet-500/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-xs">الإيرادات المتوقعة</span>
          <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp size={10} />الديون+المستلم
          </span>
        </div>
        <div className="text-3xl font-bold text-white">
          {(stats?.totalRevenueExpected || 0).toLocaleString()}
          <span className="text-sm font-normal text-gray-500 mr-1">د.ع</span>
        </div>
      </div>

      {/* 4-Grid Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 text-center">
          <ArrowUp size={14} className="text-emerald-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">اليوم</div>
          <div className="text-sm font-bold text-white">{(stats?.todayIncome || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 text-center">
          <Calendar size={14} className="text-blue-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">أسبوع</div>
          <div className="text-sm font-bold text-white">{(stats?.lastWeekIncome || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 text-center">
          <DollarSign size={14} className="text-violet-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">شهر</div>
          <div className="text-sm font-bold text-white">{(stats?.lastMonthIncome || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 text-center">
          <ArrowDown size={14} className="text-rose-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">ديون</div>
          <div className="text-sm font-bold text-white">{(stats?.totalDebt || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Ortho + Expenses Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Ortho Card */}
        <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 p-3 rounded-xl border border-pink-500/20">
          <div className="flex items-center gap-1 mb-2">
            <Sparkles size={14} className="text-pink-400" />
            <span className="text-xs font-bold text-white">التقويم</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>المتوقع: {(stats?.orthoExpectedRevenue || 0).toLocaleString()}</span>
            <span className="text-emerald-400">{orthoPercent}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{ width: `${Math.min(orthoPercent, 100)}%` }}></div>
          </div>
          <div className="text-xs text-emerald-400 font-bold mt-1">{(stats?.totalOrthoRevenue || 0).toLocaleString()} مكتسب</div>
        </div>

        {/* Expenses Card */}
        <div className="bg-gray-800/60 p-3 rounded-xl border border-gray-700 flex flex-col justify-between">
          <div className="flex items-center gap-1 mb-2">
            <Wallet size={14} className="text-rose-400" />
            <span className="text-xs font-bold text-white">الصرفيات</span>
          </div>
          <div className="text-xl font-bold text-white">{(stats?.totalExpenses || 0).toLocaleString()}</div>
          <button onClick={() => navigate('/expenses')} className="text-[10px] text-rose-400 hover:text-rose-300 transition mt-1">عرض التفاصيل ←</button>
        </div>
      </div>

      {/* Treatment Breakdown - Horizontal Scroll */}
      <div className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart size={14} className="text-violet-400" />
            <span className="text-sm font-bold text-white">توزيع العلاجات</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {(() => {
            const data = Object.entries(stats?.treatmentStats || {})
              .filter(([, amt]: [string, any]) => amt > 0)
              .sort(([, a]: any, [, b]: any) => b - a);

            const top5 = data.slice(0, 5);
            const othersSum = data.slice(5).reduce((sum, [, amt]: [string, any]) => sum + amt, 0);

            if (othersSum > 0) {
              top5.push(['علاجات أخرى', othersSum]);
            }

            return top5.map(([type, amt]: [string, any]) => {
              const pct = Math.round((amt / (stats?.totalPaid || 1)) * 100);
              // Clean up tooth numbers from type display if present (e.g., "15: type" -> "type")
              const displayType = type.includes(':') ? type.split(':')[1].trim() : type;

              return (
                <div key={type} className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/50 min-w-[100px] flex-shrink-0">
                  <div className="text-[10px] text-gray-400 mb-1 line-clamp-1">{displayType}</div>
                  <div className="text-sm font-bold text-white">{amt.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-500">{pct}%</div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Doctors Performance - Compact */}
      <div className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-violet-400" />
          <span className="text-sm font-bold text-white">أداء الأطباء</span>
        </div>
        <div className="space-y-2">
          {DOCTORS.map(doc => {
            const amt = stats?.doctorStats[doc.id] || 0;
            const pct = stats?.totalPaid ? Math.round((amt / stats.totalPaid) * 100) : 0;
            return (
              <div key={doc.id}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${doc.color.replace('-50', '-500')}`}></div>
                    <span className={`text-xs font-medium ${doc.textColor}`}>{doc.name}</span>
                  </div>
                  <span className="text-xs text-white font-bold">{amt.toLocaleString()} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${doc.color.replace('-50', '-500')}`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div >
  );
};
