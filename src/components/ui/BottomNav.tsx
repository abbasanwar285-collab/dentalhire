import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings, PieChart, Home, Timer, ClipboardList, Package } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/ClinicContext';

export function BottomNav() {
  const location = useLocation();
  const { hasPermission, currentUser } = useAuth();
  const { waitingRoom, tasks } = useClinic();

  const activeWaitingCount = waitingRoom.filter(w => w.status !== 'done').length;
  const pendingTaskCount = tasks.filter(t => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'doctor') {
      return t.status === 'pending';
    }
    return t.status === 'pending' && t.assignedToUserId === currentUser?.id;
  }).length;

  const isSecretaryOrAssistant = currentUser?.role === 'secretary' || currentUser?.role === 'accountant';

  const allNavItems = [
    { icon: Home, label: 'الرئيسية', path: '/dashboard', permission: 'view_dashboard' as const },
    { icon: Calendar, label: 'المواعيد', path: '/appointments', permission: 'view_appointments' as const },
    { icon: Timer, label: 'الانتظار', path: '/waiting-room', permission: null, badge: activeWaitingCount },
    { icon: Users, label: 'المرضى', path: '/patients', permission: 'view_patients' as const },
    // Show Tasks + Supply Requests only for secretaries/assistants; show Indicators for others
    ...(isSecretaryOrAssistant ? [
      { icon: ClipboardList, label: 'المهام', path: '/tasks', permission: null, badge: pendingTaskCount },
      { icon: Package, label: 'المستلزمات', path: '/supply-requests', permission: null, badge: 0 },
    ] : [
      { icon: PieChart, label: 'المؤشرات', path: '/indicators', permission: 'view_indicators' as const },
    ]),
    { icon: Settings, label: 'الإعدادات', path: '/settings', permission: null },
  ];

  const navItems = allNavItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/85 backdrop-blur-2xl border-t border-slate-200 transition-colors duration-300 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]" aria-label="التنقل السفلي" dir="rtl">
      <div className="flex items-center justify-between w-full h-[60px] px-2 pb-safe" role="tablist">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const badge = 'badge' in item ? item.badge : 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200',
                isActive ? 'text-teal-600' : 'text-slate-400'
              )}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
            >
              {/* Active indicator glow dot */}
              {isActive && (
                <span className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-teal-500" />
              )}
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-[22px] h-[22px] transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -left-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-1 shadow-sm shadow-red-500/30 animate-pulse">
                    {badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
