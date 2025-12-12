// ============================================
// DentalHire - Storage Service with Supabase
// ============================================

import { getSupabaseClient } from './supabase';
import { generateId } from './utils';

const BUCKETS = {
    AVATARS: 'avatars',
    DOCUMENTS: 'documents',
    LOGOS: 'logos',
} as const;

type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
    file: File,
    bucket: BucketName,
    userId: string
): Promise<{ url: string; path: string } | null> {
    try {
        const supabase = getSupabaseClient();

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${generateId()}.${fileExt}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            url: publicUrl,
            path: data.path,
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
    path: string,
    bucket: BucketName
): Promise<boolean> {
    try {
        const supabase = getSupabaseClient();

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            console.error('Error deleting file:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File, userId: string) {
    return uploadFile(file, BUCKETS.AVATARS, userId);
}

/**
 * Upload document (CV, certificates, etc.)
 */
export async function uploadDocument(file: File, userId: string) {
    return uploadFile(file, BUCKETS.DOCUMENTS, userId);
}

/**
 * Upload clinic logo
 */
export async function uploadLogo(file: File, userId: string) {
    return uploadFile(file, BUCKETS.LOGOS, userId);
}

/**
 * Delete avatar
 */
export async function deleteAvatar(path: string) {
    return deleteFile(path, BUCKETS.AVATARS);
}

/**
 * Delete document
 */
export async function deleteDocument(path: string) {
    return deleteFile(path, BUCKETS.DOCUMENTS);
}

/**
 * Delete logo
 */
export async function deleteLogo(path: string) {
    return deleteFile(path, BUCKETS.LOGOS);
}

/**
 * Get file type icon
 */
export function getFileTypeIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
            return '🖼️';
        case 'zip':
        case 'rar':
        case '7z':
            return '📦';
        default:
            return '📎';
    }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
