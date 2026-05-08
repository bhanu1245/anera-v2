/**
 * Client-side image compression and validation utilities
 */

import { IMAGE_CONSTRAINTS } from '@/types';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an image file before upload
 */
export function validateImageFile(file: File): ValidationResult {
  if (!IMAGE_CONSTRAINTS.ACCEPTED_TYPES.includes(file.type as typeof IMAGE_CONSTRAINTS.ACCEPTED_TYPES[number])) {
    return {
      valid: false,
      error: `Invalid file type. Accepted: ${IMAGE_CONSTRAINTS.ACCEPTED_TYPES.join(', ')}`,
    };
  }

  if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
    const maxMB = IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(width: number, height: number): ValidationResult {
  if (width < IMAGE_CONSTRAINTS.MIN_DIMENSION || height < IMAGE_CONSTRAINTS.MIN_DIMENSION) {
    return {
      valid: false,
      error: `Image too small. Minimum: ${IMAGE_CONSTRAINTS.MIN_DIMENSION}px`,
    };
  }

  if (width > IMAGE_CONSTRAINTS.MAX_DIMENSION || height > IMAGE_CONSTRAINTS.MAX_DIMENSION) {
    return {
      valid: false,
      error: `Image too large. Maximum: ${IMAGE_CONSTRAINTS.MAX_DIMENSION}px`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from a File
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Compress an image file client-side using Canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = IMAGE_CONSTRAINTS.THUMBNAIL_SIZE,
    maxHeight = IMAGE_CONSTRAINTS.THUMBNAIL_SIZE,
    quality = IMAGE_CONSTRAINTS.QUALITY,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Full validation pipeline for an image file
 */
export async function validateAndCompressImage(
  file: File,
  compressionOptions?: CompressionOptions
): Promise<{ blob: Blob; error?: string }> {
  // Step 1: Validate file type and size
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    return { blob: file, error: fileValidation.error };
  }

  // Step 2: Validate dimensions
  try {
    const dimensions = await getImageDimensions(file);
    const dimValidation = validateImageDimensions(dimensions.width, dimensions.height);
    if (!dimValidation.valid) {
      return { blob: file, error: dimValidation.error };
    }
  } catch {
    return { blob: file, error: 'Could not read image dimensions' };
  }

  // Step 3: Compress
  try {
    const blob = await compressImage(file, compressionOptions);
    return { blob };
  } catch {
    // If compression fails, return original file
    return { blob: file };
  }
}
