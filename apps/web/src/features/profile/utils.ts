/**
 * Crops and resizes an image file based on coordinates from a cropper using HTML5 canvas.
 * Outputs a compressed WebP Blob.
 */
export function cropAvatar(
  file: File,
  area: { x: number; y: number; width: number; height: number },
  size = 256,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/webp',
          0.8, // High quality WebP compression
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the storage path (e.g. "userId/avatar-timestamp.jpg") from a public Supabase storage URL.
 */
export function extractStoragePath(url: string): string | null {
  const marker = '/public/avatars/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.substring(index + marker.length);
}
