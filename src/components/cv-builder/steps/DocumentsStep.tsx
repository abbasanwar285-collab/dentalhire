'use client';

// ============================================
// DentalHire - Documents Step
// ============================================

import { useState } from 'react';
import { useCVStore, useAuthStore } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateId } from '@/lib/utils';
import { FileText, Upload, Trash2, File, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export default function DocumentsStep() {
    const { documents, addDocument, removeDocument, saveCV } = useCVStore();
    const { user } = useAuthStore();
    const { language, t } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const documentTypes = [
        { type: 'identification', label: language === 'ar' ? 'هوية تعريفية' : 'Identification', icon: <File size={20} />, accept: '.pdf,.jpg,.png', multiple: false },
        { type: 'portfolio', label: language === 'ar' ? 'نماذج أعمال (يمكنك رفع صور أو ملفات PDF متعددة)' : 'Portfolio/Work Samples (You can upload multiple images/PDFs)', icon: <File size={20} />, accept: '.pdf,.jpg,.png', multiple: true },
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setUploadError(null);

        try {
            // Get current user
            const supabase = getSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error(language === 'ar' ? 'يجب تسجيل الدخول لرفع الملفات' : 'You must be logged in to upload files');
            }

            for (const file of files) {
                console.log('[DocumentUpload] Processing file:', file.name);

                // Generate unique filename
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                // Upload to Supabase Storage
                const { error } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName);

                if (urlData.publicUrl.startsWith('blob:')) {
                    throw new Error('Upload failed - got blob URL instead of storage URL');
                }

                // For single-file types (like ID), remove old one first
                if (type === 'identification') {
                    const existingDoc = documents.find(d => d.type === type);
                    if (existingDoc) {
                        removeDocument(existingDoc.id);
                    }
                }

                // Add document to store
                addDocument({
                    id: generateId(),
                    name: file.name,
                    type: type,
                    url: urlData.publicUrl,
                    uploadedAt: new Date(),
                });
            }

            // Save once after all uploads
            if (user?.id) {
                await saveCV(user.id);
            }

        } catch (error: any) {
            console.error('[DocumentUpload] Error:', error);
            const errorMsg = error.message || (language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file');
            setUploadError(errorMsg);
            alert('Upload Error: ' + errorMsg);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <p className="text-gray-600 dark:text-gray-400">
                    {language === 'ar'
                        ? 'ارفع المستندات الداعمة لتعزيز طلبك.'
                        : 'Upload supporting documents to strengthen your application.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {language === 'ar'
                        ? 'الصيغ المقبولة: PDF، JPG، PNG. الحجم الأقصى: 10MB.'
                        : 'Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB.'}
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
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                                    >
                                        {doc.name}
                                    </a>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500 capitalize">{doc.type}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle size={12} /> {language === 'ar' ? 'مرفوع' : 'Uploaded'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    aria-label={language === 'ar' ? 'عرض' : 'View'}
                                >
                                    <FileText size={16} />
                                </a>
                                <button
                                    onClick={async () => {
                                        removeDocument(doc.id);
                                        if (user?.id) {
                                            await saveCV(user.id);
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    aria-label={`${language === 'ar' ? 'حذف' : 'Remove'} ${doc.name}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Areas */}
            <div className="grid grid-cols-1 gap-4">
                {documentTypes.map((docType) => {
                    const hasDoc = documents.some(d => d.type === docType.type);
                    // For portfolio, we always show upload state unless user explicitly deletes all
                    // Actually for portfolio we just want to show "Add more" style if files exist? 
                    // But to keep it simple, we stick to the card design.

                    return (
                        <label
                            key={docType.type}
                            className={`relative p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${hasDoc && !docType.multiple
                                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
                                }`}
                        >
                            <input
                                type="file"
                                accept={docType.accept}
                                multiple={docType.multiple}
                                onChange={(e) => handleFileUpload(e, docType.type)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label={`${language === 'ar' ? 'رفع' : 'Upload'} ${docType.label}`}
                            />
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasDoc && !docType.multiple
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {hasDoc && !docType.multiple ? <CheckCircle size={24} /> : docType.icon}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium text-lg ${hasDoc && !docType.multiple ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {docType.label}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {docType.multiple
                                            ? (language === 'ar' ? 'يمكنك اختيار صور متعددة أو ملفات PDF معاً' : 'You can select multiple images or PDFs at once')
                                            : hasDoc
                                                ? (language === 'ar' ? 'انقر للاستبدال' : 'Click to replace')
                                                : (language === 'ar' ? 'انقر للرفع' : 'Click to upload')}
                                    </p>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>

            {uploading && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        {language === 'ar' ? 'جاري رفع الملفات...' : 'Uploading files...'}
                    </p>
                </div>
            )}

            {uploadError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3 border border-red-200 dark:border-red-800">
                    <AlertCircle size={20} className="text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                        {uploadError}
                    </p>
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                            {language === 'ar' ? 'ملاحظة مهمة' : 'Important Note'}
                        </p>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                            <li>{language === 'ar' ? 'يمكنك رفع عدد غير محدود من الصور أو ملفات PDF في قسم نماذج الأعمال.' : 'You can upload an unlimited number of images or PDF files in the Portfolio section.'}</li>
                            <li>{language === 'ar' ? 'تأكد من وضوح الصور ودقتها لعرض أعمالك بأفضل شكل.' : 'Ensure images are clear and high quality to showcase your work.'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
