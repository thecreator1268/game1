export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

const MAX_PHOTO_DIMENSION = 480;
const PHOTO_JPEG_QUALITY = 0.82;

// Family photos only ever render as small avatars/cards (FamilyManager list,
// Naam Yaad's game board) — an unprocessed phone-camera photo (often
// 3-8MB) buys no visible quality there but multiplies IndexedDB size and
// every render/query that touches the family-member record. Downscaling
// client-side keeps photos sharp at the size they're actually shown while
// cutting storage by roughly one to two orders of magnitude.
export async function readImageFileAsCompressedDataUrl(
  file: File,
  maxDimension = MAX_PHOTO_DIMENSION,
  quality = PHOTO_JPEG_QUALITY,
): Promise<string> {
  const original = await readFileAsDataUrl(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return original; // no canvas support — fall back rather than fail the upload

  const image = await loadImage(original);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
