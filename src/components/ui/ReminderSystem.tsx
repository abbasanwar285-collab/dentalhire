import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { 
  generateAppointmentReminders, 
  checkAndSendReminders,
  AppointmentReminder 
} from '../../lib/smartAlgorithms';
import { format, isAfter, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { haptic } from '../../lib/haptics';

interface ReminderSystemProps {
  className?: string;
}

export function ReminderSystem({ className }: ReminderSystemProps) {
  const { appointments, patients } = useClinic();
  const [reminders, setReminders] = useState<AppointmentReminder[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<AppointmentReminder | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isProcessing, setIsProcessing] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  // Generate reminders for all upcoming appointments
  const generateAllReminders = useCallback(() => {
    const allReminders: AppointmentReminder[] = [];
    
    appointments.forEach(appointment => {
      const patient = patients.find(p => p.id === appointment.patientId);
      if (!patient) return;
      
      // Only generate reminders for upcoming appointments
      const appointmentDate = parseISO(appointment.date);
      if (isAfter(appointmentDate, new Date())) {
        const appointmentReminders = generateAppointmentReminders(appointment, patient);
        allReminders.push(...appointmentReminders);
      }
    });
    
    setReminders(allReminders);
  }, [appointments, patients]);

  // Generate reminders when appointments change
  useEffect(() => {
    generateAllReminders();
  }, [generateAllReminders]);

  // Check and process pending reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      processPendingReminders();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders]);

  const processPendingReminders = async () => {
    if (isProcessing || reminders.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const updatedReminders = await checkAndSendReminders(reminders, async (reminder) => {
        return await sendReminder(reminder);
      });
      
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error processing reminders:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendReminder = async (reminder: AppointmentReminder): Promise<boolean> => {
    try {
      const appointment = appointments.find(apt => apt.id === reminder.appointmentId);
      const patient = patients.find(p => p.id === reminder.patientId);
      
      if (!appointment || !patient) return false;

      // Show in-app notification
      setCurrentReminder(reminder);
      setShowNotification(true);
      
      // Browser notification if permitted
      if (permission === 'granted') {
        new Notification(`تذكير بالموعد - ${patient.name}`, {
          body: reminder.message,
          icon: '/clinic-icon.png',
          tag: reminder.id,
          requireInteraction: true
        });
      }
      
      // Haptic feedback
      haptic.medium();
      
      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      return false;
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
    setCurrentReminder(null);
  };

  const viewAppointment = () => {
    if (currentReminder) {
      // Navigate to patient profile
      window.location.href = `/patients/${currentReminder.patientId}`;
    }
    dismissNotification();
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case '24h': return <Clock className="w-5 h-5 text-blue-500" />;
      case '1h': return <Bell className="w-5 h-5 text-orange-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case '24h': return 'تذكير قبل 24 ساعة';
      case '1h': return 'تذكير قبل ساعة';
      default: return 'تذكير';
    }
  };

  const pendingReminders = reminders.filter(r => !r.sent);
  const upcomingAppointments = appointments.filter(apt => {
    const appointmentDate = parseISO(apt.date);
    return isAfter(appointmentDate, new Date());
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* In-app notification */}
      {showNotification && currentReminder && (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            {getReminderIcon(currentReminder.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {getReminderTypeLabel(currentReminder.type)}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {currentReminder.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={viewAppointment}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  عرض التفاصيل
                </button>
                <button
                  onClick={dismissNotification}
                  className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  تجاهل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Settings */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">نظام التذكير الذكي</h3>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">
              {permission === 'granted' ? 'الإشعارات مفعلة' : 'الإشعارات غير مفعلة'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">تذكير قبل 24 ساعة</p>
                <p className="text-xs text-gray-600">يتم إرساله تلقائياً</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>

          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">تذكير قبل ساعة</p>
                <p className="text-xs text-gray-600">تذكير نهائي قبل الموعد</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">المواعيد القادمة</p>
              <p className="text-xs text-gray-600">سيتم إرسال التذكيرات تلقائياً</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">{upcomingAppointments.length}</p>
              <p className="text-xs text-gray-600">موعد قادم</p>
            </div>
          </div>
        </div>

        {pendingReminders.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">تذكيرات معلقة</p>
                <p className="text-xs text-blue-600">سيتم إرسالها تلقائياً</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{pendingReminders.length}</p>
                <p className="text-xs text-blue-600">تذكير معلق</p>
              </div>
            </div>
          </div>
        )}

        {permission !== 'granted' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">الإشعارات غير مفعلة</p>
                <p className="text-xs text-yellow-600">
                  فعّل الإشعارات لتلقي التذكيرات على الشاشة
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Reminders */}
      {reminders.filter(r => r.sent).length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">التذكيرات المرسلة</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {reminders
              .filter(r => r.sent)
              .slice(-5)
              .reverse()
              .map(reminder => {
                const appointment = appointments.find(apt => apt.id === reminder.appointmentId);
                const patient = patients.find(p => p.id === reminder.patientId);
                
                if (!appointment || !patient) return null;
                
                return (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {getReminderIcon(reminder.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {patient.name} - {getReminderTypeLabel(reminder.type)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(parseISO(appointment.date), 'dd MMMM yyyy', { locale: ar })} الساعة {appointment.time}
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}