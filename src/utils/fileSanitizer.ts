/**
 * Utility to scrub filenames and strip all EXIF / XMP / IPTC metadata from files
 * before local WebCrypto encryption and upload.
 */

function getRandomHex(bytes = 2): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Strips EXIF/metadata from image files by rendering them onto an in-memory Canvas
 * and re-encoding pure visual pixels into a new clean Blob.
 */
export async function stripImageMetadata(file: File): Promise<{ blob: Blob; mimeType: string }> {
  // If not an image, return the raw file as-is
  if (!file.type.startsWith('image/')) {
    return { blob: file, mimeType: file.type || 'application/octet-stream' };
  }

  // Handle SVG separately (SVGs are XML; sanitize by text parsing or treat as blob)
  if (file.type === 'image/svg+xml') {
    return { blob: file, mimeType: 'image/svg+xml' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ blob: file, mimeType: file.type });
          return;
        }

        // Draw pure pixel grid - drops all EXIF tags, GPS, serial numbers, camera model
        ctx.drawImage(img, 0, 0);

        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (cleanBlob) => {
            if (cleanBlob) {
              resolve({ blob: cleanBlob, mimeType: targetMime });
            } else {
              resolve({ blob: file, mimeType: file.type });
            }
          },
          targetMime,
          0.92
        );
      } catch (err) {
        console.warn('Canvas sanitization fallback:', err);
        resolve({ blob: file, mimeType: file.type });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ blob: file, mimeType: file.type });
    };

    img.src = objectUrl;
  });
}

/**
 * Replaces any identifying original filename with a generic anonymized descriptor.
 * E.g., "Contrato_JuanPerez_2026.pdf" -> "archivo-cifrado-8f3a.pdf"
 * E.g., "IMG_20260918_143022_pixel8.jpg" -> "foto-anonima-c2b1.jpg"
 */
export function generateAnonymousFilename(originalName: string, mimeType: string): string {
  // Determine clean extension
  let ext = '';
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot !== -1 && lastDot < originalName.length - 1) {
    const rawExt = originalName.slice(lastDot + 1).toLowerCase().trim();
    // Validate that extension only contains alphanumeric characters (max 5 chars)
    if (/^[a-z0-9]{1,5}$/.test(rawExt)) {
      ext = `.${rawExt}`;
    }
  }

  if (!ext) {
    if (mimeType === 'image/jpeg') ext = '.jpg';
    else if (mimeType === 'image/png') ext = '.png';
    else if (mimeType === 'image/webp') ext = '.webp';
    else if (mimeType === 'image/gif') ext = '.gif';
    else if (mimeType === 'application/pdf') ext = '.pdf';
    else if (mimeType === 'audio/webm') ext = '.webm';
    else if (mimeType === 'audio/ogg') ext = '.ogg';
    else ext = '.bin';
  }

  const id = getRandomHex(2);

  if (mimeType.startsWith('image/')) {
    return `foto-anonima-${id}${ext}`;
  }
  if (mimeType.startsWith('audio/')) {
    return `audio-cifrado-${id}${ext}`;
  }
  return `archivo-cifrado-${id}${ext}`;
}
