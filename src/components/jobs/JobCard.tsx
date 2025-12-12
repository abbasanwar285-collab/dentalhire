import { useJobStore } from '@/store/useJobStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Job } from '@/types';
import { Card } from '@/components/shared';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { Building2, MapPin, DollarSign, Clock, Heart, Briefcase, Users } from 'lucide-react';

interface JobCardProps {
    job: Job;
    isSelected?: boolean;
    onClick?: () => void;
}

export default function JobCard({ job, isSelected, onClick }: JobCardProps) {
    const { language } = useLanguage();
    const { savedJobs, toggleSavedJob } = useJobStore();

    const isSaved = savedJobs.includes(job.id);

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleSavedJob(job.id);
    };

    const getEmploymentTypeLabel = (type: string) => {
        const types: Record<string, { en: string; ar: string }> = {
            full_time: { en: 'Full-Time', ar: 'دوام كامل' },
            part_time: { en: 'Part-Time', ar: 'دوام جزئي' },
            contract: { en: 'Contract', ar: 'عقد' },
            temporary: { en: 'Temporary', ar: 'مؤقت' },
        };
        return language === 'ar' ? types[type]?.ar || type : types[type]?.en || type.replace('_', ' ');
    };

    return (
        <Card
            hover
            onClick={onClick}
            className={`cursor-pointer transition-all duration-300 group
                ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'}
            `}
        >
            <div className="flex items-start gap-4">
                {/* Clinic Logo Placeholder */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800">
                    <Building2 size={24} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {job.clinicName}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            aria-label={isSaved ? "Unsave job" : "Save job"}
                            className={`p-2 rounded-full transition-colors ${isSaved
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                            <MapPin size={14} className="text-gray-400" />
                            {job.location}
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                            <DollarSign size={14} className="text-gray-400" />
                            {job.salary.min === 0 && job.salary.max === 0
                                ? (language === 'ar' ? 'قابل للتفاوض' : 'Negotiable')
                                : job.employmentType === 'part_time'
                                    ? `${job.salary.min.toLocaleString()}-${job.salary.max.toLocaleString()} د.ع/${language === 'ar' ? 'ساعة' : 'hr'}`
                                    : `${(job.salary.min < 1000 ? job.salary.min : (job.salary.min / 1000).toFixed(0))}-${(job.salary.max < 1000 ? job.salary.max : (job.salary.max / 1000).toFixed(0))} ألف د.ع/${language === 'ar' ? 'شهر' : 'mo'}`}
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                            <Briefcase size={14} className="text-gray-400" />
                            {getEmploymentTypeLabel(job.employmentType)}
                        </span>
                        {job.gender && job.gender !== 'any' && (
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                                <Users size={14} className="text-gray-400" />
                                {job.gender === 'male' ? (language === 'ar' ? 'ذكر' : 'Male') : (language === 'ar' ? 'أنثى' : 'Female')}
                            </span>
                        )}
                        {job.workingHours && (
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                                <Clock size={14} className="text-gray-400" />
                                {job.workingHours.start} - {job.workingHours.end}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            {formatRelativeTime(job.createdAt)}
                        </span>
                        <div className="flex gap-2">
                            {job.skills.slice(0, 2).map((skill) => (
                                <span key={skill} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                    {skill}
                                </span>
                            ))}
                            {job.skills.length > 2 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                                    +{job.skills.length - 2}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
