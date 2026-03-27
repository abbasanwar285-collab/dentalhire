/**
 * Image Compressor Utility
 * 
 * Reduces bandwidth usage by compressing images before upload.
 * Optimized for X-ray and dental scan images.
 */

/**
 * Compresses an image file to reduce upload size
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1200px for X-rays)
 * @param quality - JPEG quality 0-1 (default: 0.7 for good balance)
 * @returns Compressed image as Blob
 */
export const compressImage = async (
    file: File,
    maxWidth = 1200,
    quality = 0.7
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');

                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw image with smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`[ImageCompressor] Compressed ${file.name}: ${file.size} → ${blob.size} bytes (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`);
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Load the image from file
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Compresses a base64 image string
 * @param base64 - Base64 encoded image (with or without data URL prefix)
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality 0-1
 * @returns Compressed image as base64 string
 */
export const compressBase64Image = async (
    base64: string,
    maxWidth = 1200,
    quality = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');

                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                const originalSize = base64.length;
                const newSize = compressedBase64.length;
                console.log(`[ImageCompressor] Compressed base64: ${originalSize} → ${newSize} chars (${Math.round((1 - newSize / originalSize) * 100)}% reduction)`);

                resolve(compressedBase64);
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Ensure proper data URL format
        const src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
        img.src = src;
    });
};

/**
 * Converts File to compressed File
 * @param file - Original file
 * @param maxWidth - Maximum width
 * @param quality - JPEG quality
 * @returns New compressed File object
 */
export const compressImageFile = async (
    file: File,
    maxWidth = 1200,
    quality = 0.7
): Promise<File> => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Don't compress small files (< 100KB)
    if (file.size < 100 * 1024) {
        console.log(`[ImageCompressor] Skipping small file: ${file.name} (${file.size} bytes)`);
        return file;
    }

    const blob = await compressImage(file, maxWidth, quality);
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
    });
};
