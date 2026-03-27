import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Calendar, BarChart2, PlusCircle, DollarSign, Activity, Package, Brain, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';
import { SyncStatus } from './SyncStatus';
import { useDoctorContext } from '../hooks/useDoctorContext';
import { aiService, QuickAction } from '../services/aiService';
import { cacheManager, SyncStatus as SyncStatusType } from '../services/cacheManager';
import { useAuth } from '../contexts/AuthContext';
// import { UnifiedAIAssistant } from './UnifiedAIAssistant'; // TODO: Enable when ready

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { currentDoctor } = useDoctorContext();
  const { isAdmin } = useAuth();
  const [quickActions, setQuickActions] = React.useState<QuickAction[]>([]);
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusType>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
  });
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);

  React.useEffect(() => {
    if (currentDoctor) {
      aiService.getQuickActions(currentDoctor.id).then(setQuickActions);
    }
  }, [currentDoctor]);

  // Subscribe to cacheManager for sync status
  React.useEffect(() => {
    const unsubscribe = cacheManager.subscribe((status) => {
      // Show success message when sync completes
      if (syncStatus.isSyncing && !status.isSyncing && status.pendingOperations === 0) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, [syncStatus.isSyncing]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'PlusCircle': return <PlusCircle size={20} className="text-white" />;
      case 'DollarSign': return <DollarSign size={20} className="text-white" />;
      case 'Calendar': return <Calendar size={20} className="text-white" />;
      case 'Activity': return <Activity size={20} className="text-white" />;
      case 'Brain': return <Brain size={20} className="text-white" />;
      default: return <PlusCircle size={20} className="text-white" />;
    }
  };

  return (
    <div className={`h-screen bg-[#111827] flex flex-col w-full sm:max-w-md mx-auto shadow-2xl overflow-hidden relative border-2 transition-all duration-500 ${currentDoctor?.border || 'border-gray-800'}`}>
      {/* Sync Status Indicator */}
      <SyncStatus />

      {/* Offline/Sync Indicator */}
      {showSyncSuccess && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold bg-emerald-500/20 text-emerald-300 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>تمت المزامنة بنجاح!</span>
        </div>
      )}
      {!showSyncSuccess && (!syncStatus.isOnline || syncStatus.pendingOperations > 0 || syncStatus.isSyncing) && (
        <div className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold ${!syncStatus.isOnline ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
          {!syncStatus.isOnline ? (
            <>
              <WifiOff size={16} />
              <span>وضع بدون إنترنت {syncStatus.pendingOperations > 0 ? `(${syncStatus.pendingOperations} عملية معلقة)` : ''}</span>
            </>
          ) : syncStatus.isSyncing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>جاري المزامنة...</span>
            </>
          ) : (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{syncStatus.pendingOperations} عملية معلقة</span>
            </>
          )}
        </div>
      )}


      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {/* Top Bar - Large Purple Header (Now inside main so it scrolls) */}
        <header className="bg-violet-600/30 border-b border-white/10 text-white p-6 pb-12 rounded-b-[3rem] shadow-lg mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
                عيادة إيرس 🦷
              </h1>
              <p className="text-violet-200 text-xs opacity-80">نظام إدارة متكامل</p>
            </div>
            {/* User Info & Logout Button Removed */}
          </div>

          {/* Action Buttons inside Header - Magic Dynamic Buttons */}
          <div className="flex gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {quickActions.map((action, idx) => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`${idx === 0 ? 'flex-[2]' : 'flex-1'} ${action.color}/40 backdrop-blur-md p-3 rounded-2xl flex items-center justify-center gap-2 hover:brightness-125 transition border border-white/10 group`}
                title={action.label}
              >
                {renderIcon(action.icon)}
                <span className={`font-bold text-sm text-white ${idx === 0 ? 'block' : 'hidden sm:block'}`}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="p-3 sm:p-4 pt-0">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 fixed bottom-0 w-full sm:max-w-md flex justify-around items-center p-2 pb-5 z-40">
        <NavLink
          to="/"
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-violet-400' : 'text-gray-500'}`}
        >
          <Users size={22} />
          <span className="text-[10px] font-bold mt-1">السجلات</span>
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-violet-400' : 'text-gray-500'}`}
        >
          <Calendar size={22} />
          <span className="text-[10px] font-bold mt-1">المواعيد</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/stats"
            className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-violet-400' : 'text-gray-500'}`}
          >
            <BarChart2 size={22} />
            <span className="text-[10px] font-bold mt-1">المؤشرات</span>
          </NavLink>
        )}

        {/* Staff Navigation Removed */}

        <NavLink
          to="/inventory"
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-violet-400' : 'text-gray-500'}`}
        >
          <Package size={22} />
          <span className="text-[10px] font-bold mt-1">المخزن</span>
        </NavLink>
      </nav>

      {/* Logout Confirmation Modal Removed */}
    </div>
  );
};