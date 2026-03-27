import React, { Suspense } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { db } from './services/db';
import { DoctorProvider } from './hooks/useDoctorContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationService } from './services/notificationService';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Lazy load pages
const PatientList = React.lazy(() => import('./pages/PatientList').then(module => ({ default: module.PatientList })));
const AddPatient = React.lazy(() => import('./pages/AddPatient').then(module => ({ default: module.AddPatient })));
// const PatientDetails = React.lazy(() => import('./pages/PatientDetails').then(module => ({ default: module.PatientDetails }))); // Commented out to potentially fix circular deps if any, or just standard import
const PatientDetails = React.lazy(() => import('./pages/PatientDetails').then(module => ({ default: module.PatientDetails })));
const AppointmentBooking = React.lazy(() => import('./pages/AppointmentBooking').then(module => ({ default: module.AppointmentBooking })));
const CalendarView = React.lazy(() => import('./pages/CalendarView').then(module => ({ default: module.CalendarView })));
const Stats = React.lazy(() => import('./pages/Stats').then(module => ({ default: module.Stats })));
const Expenses = React.lazy(() => import('./pages/Expenses').then(module => ({ default: module.Expenses })));
const Inventory = React.lazy(() => import('./pages/Inventory').then(module => ({ default: module.Inventory })));
const ActivityLog = React.lazy(() => import('./pages/ActivityLog').then(module => ({ default: module.ActivityLog })));
const Reports = React.lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const DoctorStats = React.lazy(() => import('./pages/DoctorStats').then(module => ({ default: module.DoctorStatsPage })));
const StaffManagement = React.lazy(() => import('./pages/admin/StaffManagement').then(module => ({ default: module.default })));
const AISettings = React.lazy(() => import('./pages/admin/AISettings').then(module => ({ default: module.default })));
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard').then(module => ({ default: module.default })));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900 text-violet-500">
    <Loader2 size={40} className="animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: 'admin' | 'doctor' | 'assistant' }) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based Access Control
  if (requiredRole) {
    if (requiredRole === 'admin' && profile?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    NotificationService.init();
    const cleanup = db.setupRealtimeSubscriptions();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <DoctorProvider>
        <ErrorBoundary>
          <MemoryRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected App Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<PatientList />} />
                  <Route path="add-patient" element={<AddPatient />} />
                  <Route path="edit-patient/:id" element={<AddPatient />} />
                  <Route path="patient/:id" element={<PatientDetails />} />
                  <Route path="appointments" element={<AppointmentBooking />} />
                  <Route path="calendar" element={<CalendarView />} />

                  {/* Admin Only Routes */}
                  <Route path="stats" element={
                    <ProtectedRoute requiredRole="admin">
                      <Stats />
                    </ProtectedRoute>
                  } />
                  <Route path="expenses" element={
                    <ProtectedRoute requiredRole="admin">
                      <Expenses />
                    </ProtectedRoute>
                  } />
                  <Route path="doctor-stats" element={
                    <ProtectedRoute requiredRole="admin">
                      <DoctorStats />
                    </ProtectedRoute>
                  } />
                  <Route path="staff" element={
                    <ProtectedRoute requiredRole="admin">
                      <StaffManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="ai-settings" element={
                    <ProtectedRoute requiredRole="admin">
                      <AISettings />
                    </ProtectedRoute>
                  } />
                  <Route path="manager" element={
                    <ProtectedRoute requiredRole="admin">
                      <ManagerDashboard />
                    </ProtectedRoute>
                  } />

                  {/* Shared but maybe restricted later */}
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="activity-log" element={<ActivityLog />} />
                  <Route path="reports" element={<Reports />} />

                  {/* Catch all route to prevent 404s and redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </MemoryRouter>
        </ErrorBoundary>
      </DoctorProvider>
    </AuthProvider>
  );
};

export default App;
