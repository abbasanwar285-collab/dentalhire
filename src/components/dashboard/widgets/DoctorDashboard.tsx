import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, Eye, MessageSquare, Target, Activity, FileText, Stethoscope } from 'lucide-react';

export default function DoctorDashboard() {
    const { language } = useLanguage();

    const stats = [
        { label: language === 'ar' ? 'مشاهدات الملف' : 'Profile Views', value: '0', icon: <Eye size={20} />, change: '0%' },
        { label: language === 'ar' ? 'نسبة التطابق' : 'Match Score', value: 'N/A', icon: <Target size={20} />, change: '' },
        { label: language === 'ar' ? 'رسائل العيادات' : 'Clinic Messages', value: '0', icon: <MessageSquare size={20} />, change: '0' },
        { label: language === 'ar' ? 'طلبات العمل' : 'Job Applications', value: '0', icon: <Briefcase size={20} />, change: '0 Pending' },
    ];

    const specialtyJobs: { title: string; clinic: string; location: string; type: string }[] = [];

    return (
        <div className="space-y-6">
            {/* Doctor Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                {stat.change && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                        {stat.change}
                                    </p>
                                )}
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Specialty Jobs */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={language === 'ar' ? 'وظائف مقترحة لتخصصك' : 'Recommended for your Specialty'}
                    // icon={<Stethoscope className="text-blue-500" size={20} />}
                    // action={<Button variant="ghost" size="sm">{t('dashboard.viewall')}</Button>}
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {specialtyJobs.length > 0 ? (
                                specialtyJobs.map((job, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                                <Briefcase size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{job.title}</h4>
                                                <p className="text-xs text-muted-foreground">{job.clinic} • {job.location}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">{language === 'ar' ? 'تقديم' : 'Apply'}</Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Stethoscope className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p>{language === 'ar' ? 'لا توجد وظائف متاحة حالياً' : 'No jobs available right now'}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Inbox Preview */}
                <Card>
                    <CardHeader
                        title={language === 'ar' ? 'صندوق البريد الطبي' : 'Medical Inbox'}
                    // icon={<MessageSquare className="text-green-500" size={20} />}
                    />
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center py-6 text-gray-500">
                                <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                <p>{language === 'ar' ? 'لا توجد رسائل جديدة' : 'No new messages'}</p>
                            </div>
                            <Button className="w-full" variant="outline" size="sm">
                                {language === 'ar' ? 'عرض كل الرسائل' : 'View All Messages'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
