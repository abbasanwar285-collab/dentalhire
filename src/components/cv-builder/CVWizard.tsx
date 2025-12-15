'use client';

// ============================================
// DentalHire - CV Builder Wizard Component
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useCVStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyzeCV } from '@/lib/gemini';
import { CV } from '@/types';
import Confetti from '@/components/shared/Confetti';
import { useToast } from '@/components/shared';
import { useRouter } from 'next/navigation';
import {
    User,
    Briefcase,
    Wrench,
    Award,
    Languages,
    DollarSign,
    MapPin,
    Calendar,
    FileText,
    Check,
    ChevronLeft,
    ChevronRight,
    Save,
    Eye,
    Sparkles,
    X,
    ArrowLeft,
    Menu,
} from 'lucide-react';

// Step Components
import {
    PersonalInfoStep,
    ExperienceStep,
    SkillsStep,
    CertificationsStep,
    LanguagesStep,
    SalaryStep,
    LocationStep,
    AvailabilityStep,
    DocumentsStep,
} from './steps';

interface StepConfig {
    id: number;
    titleKey: string;
    descKey: string;
    icon: React.ReactNode;
    required: boolean;
}

export default function CVWizard() {
    const { currentStep, setStep, nextStep, prevStep, isStepValid, isStepCompleted, getCompletionPercentage, saveCV, loadCV, isDirty } = useCVStore();
    const { user } = useAuthStore();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const router = useRouter();

    const [showPreview, setShowPreview] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<{ tips: string[]; summary: string } | null>(null);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // New state for mobile step overlay
    const [isMobileStepOpen, setIsMobileStepOpen] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    const cvState = useCVStore();

    // Load CV Data on Mount
    useEffect(() => {
        if (user?.id) {
            loadCV(user.id);
        }
    }, [user?.id, loadCV]);

    // Scroll to top of overlay when step changes
    useEffect(() => {
        // Only scroll the specific content area, not the whole overlay since we using sticky footer
        if (isMobileStepOpen) {
            const contentArea = document.getElementById('mobile-step-content');
            if (contentArea) {
                contentArea.scrollTop = 0;
            }
        }
    }, [currentStep, isMobileStepOpen]);

    const handleAnalyze = async () => {
        if (getCompletionPercentage() < 50) {
            addToast(t('Please complete at least 50% of your CV before analysis.'), 'warning');
            return;
        }

        setIsAnalyzing(true);
        try {
            // Construct CV object from store state
            const cvData = {
                personalInfo: cvState.personalInfo,
                experience: cvState.experience,
                skills: cvState.skills,
                certifications: cvState.certifications,
                languages: cvState.languages,
                salary: cvState.salary,
                location: cvState.location,
                availability: cvState.availability,
            } as unknown as CV; // Temporary cast for analysis

            const results = await analyzeCV(cvData);
            setAnalysisResults(results);
            setShowAnalysis(true);
        } catch (error) {
            console.error('Analysis failed', error);
            addToast('Failed to analyze CV. Please try again.', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCompleteCV = async () => {
        if (!user?.id) {
            addToast('You must be logged in to save your CV.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const success = await saveCV(user.id);
            if (success) {
                setShowCompletionModal(true);
            } else {
                addToast('Failed to save CV. Please try again.', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('An error occurred while saving.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!user?.id) {
            addToast('You must be logged in to save draft.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const success = await saveCV(user.id);
            if (success) {
                addToast(t('cv.savedraft_success') || 'Draft saved successfully', 'success');
            } else {
                addToast('Failed to save draft.', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('An error occurred while saving.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const steps: StepConfig[] = [
        { id: 0, titleKey: 'cv.step.personal', descKey: 'cv.step.personal.desc', icon: <User size={18} />, required: true },
        { id: 1, titleKey: 'cv.step.experience', descKey: 'cv.step.experience.desc', icon: <Briefcase size={18} />, required: true },
        { id: 2, titleKey: 'cv.step.skills', descKey: 'cv.step.skills.desc', icon: <Wrench size={18} />, required: true },
        { id: 3, titleKey: 'cv.step.certifications', descKey: 'cv.step.certifications.desc', icon: <Award size={18} />, required: false },
        { id: 4, titleKey: 'cv.step.languages', descKey: 'cv.step.languages.desc', icon: <Languages size={18} />, required: true },
        { id: 5, titleKey: 'cv.step.salary', descKey: 'cv.step.salary.desc', icon: <DollarSign size={18} />, required: true },
        { id: 6, titleKey: 'cv.step.location', descKey: 'cv.step.location.desc', icon: <MapPin size={18} />, required: true },
        { id: 7, titleKey: 'cv.step.availability', descKey: 'cv.step.availability.desc', icon: <Calendar size={18} />, required: true },
        { id: 8, titleKey: 'cv.step.documents', descKey: 'cv.step.documents.desc', icon: <FileText size={18} />, required: false },
    ];

    const completion = getCompletionPercentage();

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <PersonalInfoStep />;
            case 1:
                return <ExperienceStep />;
            case 2:
                return <SkillsStep />;
            case 3:
                return <CertificationsStep />;
            case 4:
                return <LanguagesStep />;
            case 5:
                return <SalaryStep />;
            case 6:
                return <LocationStep />;
            case 7:
                return <AvailabilityStep />;
            case 8:
                return <DocumentsStep />;
            default:
                return <PersonalInfoStep />;
        }
    };

    // Auto-save wrapper for navigation
    const handleNavigation = async (action: () => void) => {
        if (isDirty && user?.id) {
            // We don't await here to make UI snappy, or we show loading?
            // "Problem": If we don't await, the user might switch page before save completes?
            // But within the wizard, state is persisted in local storage too.
            // The issue is DB sync.
            // Let's await to be safe and ensure DB is updated.
            await saveCV(user.id);
        }
        action();
    };

    const canProceed = isStepValid(currentStep) || !steps[currentStep].required;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="container-custom">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('cv.title')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {t('cv.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                leftIcon={<Save size={18} />}
                                onClick={handleSaveDraft}
                                loading={isSaving}
                            >
                                {t('cv.savedraft')}
                            </Button>

                            <Button variant="outline" leftIcon={<Eye size={18} />} onClick={() => setShowPreview(!showPreview)}>
                                {t('cv.preview')}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300"
                                leftIcon={isAnalyzing ? undefined : <Sparkles size={18} />}
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'AI Review'}
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar - Hidden when mobile step is open to save space/focus */}
                    <div className={cn("mt-6", isMobileStepOpen ? "hidden lg:block" : "block")}>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">{t('cv.progress')}</span>
                            <span className="font-medium text-blue-600">{completion}% {t('cv.complete')}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500"
                                // eslint-disable-next-line react-dom/no-unsafe-inline-style
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar - Steps Navigation */}
                    {/* Hide sidebar on mobile if a step is open */}
                    <div className={cn("lg:col-span-1", isMobileStepOpen ? "hidden lg:block" : "block")}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-24">
                            <nav className="space-y-1">
                                {steps.map((step) => {
                                    const isActive = currentStep === step.id;
                                    const isComplete = isStepCompleted(step.id);

                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => {
                                                handleNavigation(() => {
                                                    setStep(step.id);
                                                    setIsMobileStepOpen(true);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                });
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-all',
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                                                    isActive
                                                        ? 'bg-blue-500 text-white'
                                                        : isComplete
                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                )}
                                            >
                                                {isComplete ? <Check size={16} /> : step.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        'text-sm font-medium truncate',
                                                        isActive
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-900 dark:text-white'
                                                    )}
                                                >
                                                    {t(step.titleKey)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {t(step.descKey)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div
                        ref={overlayRef}
                        className={cn(
                            "lg:col-span-3 transition-all duration-300",
                            // Mobile Overlay Styles
                            isMobileStepOpen
                                ? "fixed inset-0 z-[105] bg-gray-50 dark:bg-gray-900 flex flex-col h-[100dvh]"
                                : "hidden lg:block"
                        )}
                    >
                        <div className={cn(
                            "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] flex flex-col",
                            isMobileStepOpen ? "flex-1 rounded-none border-0 shadow-none h-full" : "p-6 md:p-8"
                        )}>

                            {/* Scrollable Content Area for Mobile */}
                            <div
                                id="mobile-step-content"
                                className={cn(
                                    "flex-1",
                                    isMobileStepOpen ? "overflow-y-auto p-4 scroll-smooth" : ""
                                )}
                            >
                                {/* Mobile Back Button */}
                                <div className="lg:hidden mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsMobileStepOpen(false)}
                                        className="p-0 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    >
                                        <div className="flex items-center gap-1">
                                            <ArrowLeft size={20} className={language === 'ar' ? 'rotate-180' : ''} />
                                            <span>{t('common.back') || 'Back'}</span>
                                        </div>
                                    </Button>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-center pr-8">
                                        {t(steps[currentStep].titleKey)}
                                    </h3>
                                </div>

                                {/* Step Header (Desktop mainly, but kept for structure) */}
                                <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700 hidden lg:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            {steps[currentStep].icon}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                {t(steps[currentStep].titleKey)}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t('cv.step')} {currentStep + 1} {t('cv.of')} {steps.length}
                                                {!steps[currentStep].required && ` • ${t('cv.optional')}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="animate-fade-in">
                                    {renderStep()}
                                </div>
                            </div>

                            {/* Navigation Buttons - Sticky Footer on Mobile */}
                            <div className={cn(
                                "mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between",
                                isMobileStepOpen ? "sticky bottom-0 bg-white dark:bg-gray-800 p-4 pb-safe mt-0 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10" : ""
                            )}>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleNavigation(prevStep)}
                                    disabled={currentStep === 0}
                                    leftIcon={<ChevronLeft size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
                                >
                                    {t('cv.previous')}
                                </Button>

                                <div className="flex items-center gap-3">
                                    {!steps[currentStep].required && (
                                        <Button variant="ghost" onClick={() => handleNavigation(nextStep)}>
                                            {t('cv.skip')}
                                        </Button>
                                    )}
                                    {currentStep === steps.length - 1 ? (
                                        <Button
                                            onClick={handleCompleteCV}
                                            rightIcon={<Check size={18} />}
                                            loading={isSaving}
                                        >
                                            {t('cv.completecv')}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleNavigation(nextStep)}
                                            disabled={!canProceed}
                                            loading={isSaving}
                                            rightIcon={<ChevronRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />}
                                        >
                                            {t('cv.continue')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Analysis Modal */}
            {showAnalysis && analysisResults && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <Sparkles size={18} /> AI CV Analysis
                            </h3>
                            <button onClick={() => setShowAnalysis(false)} className="text-white/80 hover:text-white" aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Summary
                                </h4>
                                <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm border-l-4 border-purple-500">
                                    {analysisResults.summary}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Improvement Tips
                                </h4>
                                <ul className="space-y-3">
                                    {analysisResults.tips?.map((tip, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                {idx + 1}
                                            </span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                                <Button onClick={() => setShowAnalysis(false)} className="w-full">
                                    Close & Apply Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Completion Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
                    <Confetti />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform scale-100 transition-all">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                <Sparkles size={40} className="text-green-600 dark:text-green-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {language === 'ar' ? 'تم حفظ معلوماتك بنجاح!' : 'Information Saved Successfully!'}
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                {language === 'ar'
                                    ? 'نشكرك على إكمال سيرتك الذاتية. نتمنى لك التوفيق في الحصول على الوظيفة المناسبة التي تطمح إليها.'
                                    : 'Thank you for completing your CV. We wish you the best of luck in finding the perfect job that matches your aspirations.'}
                            </p>

                            <div className="pt-4">
                                <Button
                                    onClick={() => {
                                        setShowCompletionModal(false);
                                        router.push('/job-seeker/dashboard');
                                    }}
                                    className="w-full py-6 text-lg"
                                >
                                    {language === 'ar' ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
