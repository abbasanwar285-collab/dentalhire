'use client';

// ============================================
// DentalHire - Documents Step
// ============================================

import { useState } from 'react';
import { useCVStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateId } from '@/lib/utils';
import { FileText, Upload, Trash2, File, CheckCircle, AlertCircle } from 'lucide-react';

export default function DocumentsStep() {
    const { documents, addDocument, removeDocument } = useCVStore();
    const { language, t } = useLanguage();
    const [uploading, setUploading] = useState(false);

    const documentTypes = [
        { type: 'resume', label: language === 'ar' ? 'السيرة الذاتية (PDF)' : 'Resume/CV (PDF)', icon: <FileText size={20} />, accept: '.pdf,.doc,.docx' },
        { type: 'certification', label: language === 'ar' ? 'شهادة' : 'Certification', icon: <File size={20} />, accept: '.pdf,.jpg,.png' },
        { type: 'license', label: language === 'ar' ? 'ترخيص' : 'License', icon: <File size={20} />, accept: '.pdf,.jpg,.png' },
        { type: 'portfolio', label: language === 'ar' ? 'نماذج أعمال' : 'Portfolio/Work Samples', icon: <File size={20} />, accept: '.pdf,.jpg,.png,.zip' },
        { type: 'other', label: language === 'ar' ? 'مستند آخر' : 'Other Document', icon: <File size={20} />, accept: '.pdf,.doc,.docx,.jpg,.png' },
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In production, this would upload to cloud storage
        // For demo, we simulate the upload
        setUploading(true);

        setTimeout(() => {
            addDocument({
                id: generateId(),
                name: file.name,
                type: type,
                url: URL.createObjectURL(file), // In production: cloud storage URL
                uploadedAt: new Date(),
            });
            setUploading(false);
        }, 1000);
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <p className="text-gray-600 dark:text-gray-400">
                    {language === 'ar'
                        ? 'ارفع المستندات الداعمة لتعزيز طلبك. هذه الخطوة اختيارية.'
                        : 'Upload supporting documents to strengthen your application. This step is optional.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {language === 'ar'
                        ? 'الصيغ المقبولة: PDF، DOC، DOCX، JPG، PNG. الحجم الأقصى: 10MB.'
                        : 'Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum file size: 10MB.'}
                </p>
            </div>

            {/* Uploaded Documents */}
            {documents.length > 0 && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'ar' ? `المستندات المرفوعة (${documents.length})` : `Uploaded Documents (${documents.length})`}
                    </label>
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500 capitalize">{doc.type}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle size={12} /> {language === 'ar' ? 'مرفوع' : 'Uploaded'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeDocument(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                aria-label={`${language === 'ar' ? 'حذف' : 'Remove'} ${doc.name}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentTypes.map((docType) => {
                    const hasDoc = documents.some(d => d.type === docType.type);

                    return (
                        <label
                            key={docType.type}
                            className={`relative p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${hasDoc
                                ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
                                }`}
                        >
                            <input
                                type="file"
                                accept={docType.accept}
                                onChange={(e) => handleFileUpload(e, docType.type)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label={`${language === 'ar' ? 'رفع' : 'Upload'} ${docType.label}`}
                            />
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasDoc
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {hasDoc ? <CheckCircle size={20} /> : docType.icon}
                                </div>
                                <div>
                                    <p className={`font-medium text-sm ${hasDoc ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {docType.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {hasDoc
                                            ? (language === 'ar' ? 'انقر للاستبدال' : 'Click to replace')
                                            : (language === 'ar' ? 'انقر أو اسحب للرفع' : 'Click or drag to upload')}
                                    </p>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>

            {/* Drag & Drop Zone */}
            <div className="relative p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center hover:border-blue-500 transition-colors">
                <Upload size={40} className="mx-auto text-gray-400 mb-4" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                    {language === 'ar' ? 'اسحب وأفلت الملفات هنا' : 'Drag and drop files here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' ? 'أو انقر للتصفح من جهازك' : 'or click to browse from your computer'}
                </p>
                <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                            addDocument({
                                id: generateId(),
                                name: file.name,
                                type: 'other',
                                url: URL.createObjectURL(file),
                                uploadedAt: new Date(),
                            });
                        });
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title={language === 'ar' ? 'رفع ملفات' : 'Upload files'}
                />
            </div>

            {uploading && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        {language === 'ar' ? 'جاري رفع المستند...' : 'Uploading document...'}
                    </p>
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-gray-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {language === 'ar' ? 'نصائح لتطبيقات أفضل' : 'Tips for better applications'}
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 list-disc list-inside">
                            <li>{language === 'ar' ? 'ارفع نسخة PDF من سيرتك الذاتية لأفضل توافق' : 'Upload a PDF version of your resume for best compatibility'}</li>
                            <li>{language === 'ar' ? 'أضف نسخ من الشهادات والتراخيص ذات الصلة' : 'Include copies of relevant certifications and licenses'}</li>
                            <li>{language === 'ar' ? 'تأكد من أن المستندات واضحة وقابلة للقراءة' : 'Ensure documents are clear and readable'}</li>
                            <li>{language === 'ar' ? 'حافظ على أحجام الملفات أقل من 10MB لكل ملف' : 'Keep file sizes under 10MB each'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
