import { Card, CardHeader, CardContent, Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Eye, Users, FolderOpen, Star, BookOpen, Check } from 'lucide-react';

export default function SecretaryDashboard() {
    const { language } = useLanguage();

    const stats = [
        { label: language === 'ar' ? 'دعوات المقابلة' : 'Interview Invites', value: '0', icon: <Calendar size={20} />, change: '0 New' },
        { label: language === 'ar' ? 'مشاهدات العيادات' : 'Clinic Views', value: '0', icon: <Eye size={20} />, change: '0' },
        { label: language === 'ar' ? 'نقاط المهارات الناعمة' : 'Soft Skills Score', value: 'N/A', icon: <Star size={20} />, change: '/10' },
        { label: language === 'ar' ? 'الوظائف الإدارية' : 'Admin Jobs', value: '0', icon: <FolderOpen size={20} />, change: '0 Available' },
    ];

    const adminTasks: { title: string; clinic: string; tasks: string[] }[] = [];

    const softSkills: { name: string; score: number }[] = [];

    return (
        <div className="space-y-6">
            {/* Secretary Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base text-muted-foreground">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    {stat.change}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Admin Jobs & Tasks */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={language === 'ar' ? 'وظائف إدارية تناسبك' : 'Admin Jobs For You'}
                    // icon={<FolderOpen className="text-purple-500" size={20} />}
                    // action={<Button variant="ghost" size="sm">{t('dashboard.viewall')}</Button>}
                    />
                    <CardContent>
                        <div className="space-y-3">
                            {adminTasks.length > 0 ? (
                                adminTasks.map((job, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{job.title}</h4>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                                    {job.tasks.map(t => <span key={t} className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600">{t}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline">{language === 'ar' ? 'تقديم' : 'Apply'}</Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FolderOpen className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p>{language === 'ar' ? 'لا توجد وظائف متاحة حالياً' : 'No admin jobs available right now'}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Soft Skills & Training */}
                <Card>
                    <CardHeader
                        title={language === 'ar' ? 'تقييم المهارات المقترح' : 'Skills Assessment'}
                    // icon={<Star className="text-yellow-500" size={20} />}
                    />
                    <CardContent>
                        <div className="space-y-4">
                            {softSkills.map((skill, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 dark:text-gray-300">{skill.name}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{skill.score}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${skill.score}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 border-t dark:border-gray-700">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <BookOpen size={16} className="text-blue-500" />
                                    {language === 'ar' ? 'دورات مقترحة' : 'Suggested Course'}
                                </h5>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Medical Reception Training</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Boost your chances by +20%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
