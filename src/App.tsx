import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { BottomNav } from './components/ui/BottomNav';
import { NotificationPrompt } from './components/ui/NotificationPrompt';
import { ErrorToast } from './components/ui/ErrorToast';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { useClinic } from './context/ClinicContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const Patients = lazy(() => import('./pages/Patients').then(m => ({ default: m.Patients })));
const PatientProfile = lazy(() => import('./pages/PatientProfile').then(m => ({ default: m.PatientProfile })));
const TreatmentPlanBuilder = lazy(() => import('./pages/TreatmentPlanBuilder').then(m => ({ default: m.TreatmentPlanBuilder })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Indicators = lazy(() => import('./pages/Indicators').then(m => ({ default: m.Indicators })));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const MySalary = lazy(() => import('./pages/MySalary').then(m => ({ default: m.MySalary })));
const AdminSalarySettings = lazy(() => import('./pages/AdminSalarySettings').then(m => ({ default: m.AdminSalarySettings })));
const WaitingRoom = lazy(() => import('./pages/WaitingRoom').then(m => ({ default: m.WaitingRoom })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const SupplyRequests = lazy(() => import('./pages/SupplyRequests').then(m => ({ default: m.SupplyRequests })));
const DisplayCustomization = lazy(() => import('./pages/DisplayCustomization').then(m => ({ default: m.DisplayCustomization })));
const AssistantAssignment = lazy(() => import('./pages/AssistantAssignment').then(m => ({ default: m.AssistantAssignment })));
const FinancialManagement = lazy(() => import('./pages/FinancialManagement').then(m => ({ default: m.FinancialManagement })));

function AppContent() {
  const { error, clearError } = useClinic();
  const { isAuthenticated, currentUser } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/patients" replace />} />
          <Route path="/dashboard" element={currentUser?.permissions?.view_dashboard !== false ? <Dashboard /> : <Navigate to="/appointments" replace />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/patients/:id/plan/new" element={<TreatmentPlanBuilder />} />
          <Route path="/patients/:id/plan/:planId/edit" element={<TreatmentPlanBuilder />} />
          <Route path="/indicators" element={<Indicators />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/security" element={<SecuritySettings />} />
          <Route path="/settings/salary" element={<MySalary />} />
          <Route path="/settings/salaries-manage" element={<AdminSalarySettings />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/supply-requests" element={<SupplyRequests />} />
          <Route path="/settings/display" element={<DisplayCustomization />} />
          <Route path="/settings/assistant-assignment" element={<AssistantAssignment />} />
          <Route path="/settings/finance" element={<FinancialManagement />} />
          <Route path="*" element={<Navigate to="/patients" replace />} />
        </Routes>
      </Suspense>
      <NotificationPrompt />
      <ErrorToast message={error} onClear={clearError} />
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { background: '#334155', color: '#fff', fontSize: '14px', borderRadius: '16px', fontWeight: 'bold' } }} />
      <BottomNav />
    </Router>
  );
}


export default function App() {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClinicProvider>
          <AppContent />
        </ClinicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
