import { createWorker } from 'tesseract.js';

// Self-hosted under public/tesseract + public/tessdata (copied from the
// tesseract.js/tesseract.js-core packages at their pinned versions) so
// medicine-label scanning works fully offline. tesseract.js's own defaults
// pull the engine and language data from a public CDN, which would silently
// break this app's offline-first guarantee the first time a caregiver tries
// the scanner with no connectivity — see vite.config.ts's "ocr-assets"
// runtime-caching rule, which caches these ~7MB files after their first use
// so every use after that is fully offline.
const BASE = import.meta.env.BASE_URL;
const WORKER_PATH = `${BASE}tesseract/worker.min.js`;
const CORE_PATH = `${BASE}tesseract/core/tesseract-core-lstm.wasm.js`;
const LANG_PATH = `${BASE}tessdata`;

export async function recognizeMedicineLabel(
  image: Blob,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const worker = await createWorker('eng', undefined, {
    workerPath: WORKER_PATH,
    corePath: CORE_PATH,
    langPath: LANG_PATH,
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
