import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, Eye, DollarSign, MapPin, CheckCircle2, Award, Zap } from 'lucide-react';

export default function AssistantDashboard() {
    const { language } = useLanguage();

    const stats = [
        { label: language === 'ar' ? 'الوظائف القريبة' : 'Nearby Jobs', value: '0', icon: <MapPin size={20} />, change: '5 km radius' },
        { label: language === 'ar' ? 'الراتب المتوقع' : 'Est. Salary', value: '0 د.ع', icon: <DollarSign size={20} />, change: 'Monthly' },
        { label: language === 'ar' ? 'مشاهدات العيادات' : 'Clinic Views', value: '0', icon: <Eye size={20} />, change: '0%' },
        { label: language === 'ar' ? 'جاهزية الملف' : 'Profile Ready', value: '0%', icon: <Award size={20} />, change: 'Low' },
    ];

    const nearbyJobs: { title: string; clinic: string; dist: string; salary: string }[] = [];

    const skillsChecklist = [
        { skill: language === 'ar' ? 'التعقيم ومكافحة العدوى' : 'Sterilization & Infection Control', status: true },
        { skill: language === 'ar' ? 'تحضير المواد السنية' : 'Mixing Dental Materials', status: true },
        { skill: language === 'ar' ? 'أخذ الأشعة السينية' : 'Taking X-rays', status: false },
        { skill: language === 'ar' ? 'برامج إدارة العيادات' : 'Practice Management Software', status: false },
    ];

    return (
        <div className="space-y-6">
            {/* Assistant Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base text-gray-600 dark:text-gray-300">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                                    {stat.change}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Nearby Jobs Widget */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={language === 'ar' ? 'وظائف قريبة منك' : 'Jobs Near You'}
                    // icon and action removed to fix type error, will re-add if supported or refactor
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {nearbyJobs.length > 0 ? (
                                nearbyJobs.map((job, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white dark:bg-gray-700 p-2 rounded shadow-sm">
                                                <Briefcase size={16} className="text-teal-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{job.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-300">{job.clinic} • <span className="text-teal-600 dark:text-teal-400 font-medium">{job.dist}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{job.salary}</div>
                                            <Button size="sm" variant="ghost" className="h-6 p-0 text-xs">{language === 'ar' ? 'تفاصيل' : 'Details'}</Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-gray-500 dark:text-gray-300">{language === 'ar' ? 'لا توجد وظائف قريبة حالياً' : 'No jobs found nearby'}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Skills Checklist Widget */}
                <Card variant="gradient">
                    <CardHeader
                        title={language === 'ar' ? 'قائمة المهارات المطلوبة' : 'Top Skills Checklist'}
                    // icon={<Zap className="text-yellow-400" size={20} />} // Removed for type safety
                    />
                    <CardContent>
                        <div className="space-y-3">
                            <p className="text-xs text-white/90 mb-2">
                                {language === 'ar' ? 'المهارات الأكثر طلباً في سوق العمل:' : 'Skills most requested by clinics:'}
                            </p>
                            {skillsChecklist.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-white">
                                    {item.status ? (
                                        <CheckCircle2 size={18} className="text-green-300" />
                                    ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-white/30" />
                                    )}
                                    <span className={`text-sm ${item.status ? '' : 'opacity-70'}`}>{item.skill}</span>
                                </div>
                            ))}
                            <Button className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0" size="sm">
                                {language === 'ar' ? 'تحديث المهارات' : 'Update My Skills'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
