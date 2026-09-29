/**
 * Turns a user-selected photo into a small square JPEG data URL suitable for
 * storing on a Firestore profile document (typically 15–40 KB).
 */
export const AVATAR_SIZE = 256;
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_OUTPUT_CHARS = 140_000; // must stay under the limit in firestore.rules

export class ImageError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new ImageError("That file couldn't be read as an image. Try a JPG or PNG.")); };
    img.src = url;
  });
}

export async function photoToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError('Please choose an image file (JPG, PNG, WebP or HEIC).');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('That photo is too large. Please choose one under 15 MB.');
  }

  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new ImageError("That file couldn't be read as an image. Try a JPG or PNG.");

  // Centre-crop to a square, then scale down.
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Your browser could not process this image.');
  ctx.fillStyle = '#111111'; // background for transparent PNGs
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_OUTPUT_CHARS) return dataUrl;
  }
  throw new ImageError('Could not make this photo small enough. Please try a different one.');
}
