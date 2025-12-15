'use client';

import { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/shared';
import { Camera, Loader2, User, Building2 } from 'lucide-react';
import Image from 'next/image';
import { uploadAvatar } from '@/lib/storage';

interface ProfileImageUploadProps {
    currentImageUrl?: string | null;
    onUpload: (url: string) => Promise<void>;
    userId: string;
    altText: string;
    size?: 'sm' | 'md' | 'lg';
    type?: 'user' | 'company';
}

export default function ProfileImageUpload({
    currentImageUrl,
    onUpload,
    userId,
    altText,
    size = 'lg',
    type = 'user'
}: ProfileImageUploadProps) {
    const { language } = useLanguage();
    const { addToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            addToast(language === 'ar' ? 'حجم الصورة يجب أن لا يتجاوز 5 ميجابايت' : 'Image size must be less than 5MB', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            addToast(language === 'ar' ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadAvatar(file, userId);

            if (result?.url) {
                await onUpload(result.url);
                addToast(language === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Image updated successfully', 'success');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error(error);
            addToast(language === 'ar' ? 'حدث خطأ أثناء رفع الصورة' : 'Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="relative group mx-auto sm:mx-0">
            <div className={`${sizeClasses[size]} rounded-xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 overflow-hidden relative shadow-md flex items-center justify-center`}>
                {currentImageUrl ? (
                    <Image
                        src={currentImageUrl}
                        alt={altText}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                        {type === 'company' ? <Building2 size={size === 'sm' ? 24 : 40} /> : <User size={size === 'sm' ? 24 : 40} />}
                    </div>
                )}

                {/* Upload Overlay */}
                <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <Camera className="w-8 h-8 text-white" />
                    )}
                </div>
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
            />


        </div>
    );
}
