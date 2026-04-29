// Browser-side image compression for uploads. Resizes to fit within
// maxDimension (longest edge) and re-encodes as JPEG/WebP to keep
// avatars/logos under ~300KB. Falls back to the original file on error.

export interface CompressOptions {
  maxDimension?: number;   // px, default 1024
  quality?: number;        // 0..1, default 0.82
  mimeType?: string;       // default 'image/jpeg'
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1024, quality = 0.82, mimeType = 'image/jpeg' } = opts;

  // Skip GIFs (animation) and SVGs (vector). Skip if already tiny.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size <= 200 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, { type: mimeType });
  } catch (err) {
    console.warn('Image compression skipped:', err);
    return file;
  }
}
