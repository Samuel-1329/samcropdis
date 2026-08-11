export interface QualityReport {
  ok: boolean;
  sharpness: number;
  brightness: number;
  greenRatio: number;
  issues: string[];
  advice: string[];
}

/**
 * Local, on-device photo quality pre-check (no network).
 * Uses a Laplacian-style variance for blur, mean luma for exposure,
 * and green-pixel ratio as a weak "is there foliage" signal.
 */
export async function checkImageQuality(dataUrl: string): Promise<QualityReport> {
  const img = await loadImage(dataUrl);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { ok: true, sharpness: 0, brightness: 0, greenRatio: 0, issues: [], advice: [] };
  }
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const gray = new Float32Array(size * size);
  let sum = 0;
  let green = 0;
  for (let i = 0; i < size * size; i++) {
    const r = data[i * 4] ?? 0;
    const g = data[i * 4 + 1] ?? 0;
    const b = data[i * 4 + 2] ?? 0;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = y;
    sum += y;
    if (g > r + 8 && g > b + 8) green++;
    if ((g > 90 && r > 90 && b < 90) || (g > r && g > b)) {
      /* yellowing foliage counts too */
    }
  }
  const brightness = sum / (size * size);

  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const v =
        4 * (gray[i] ?? 0) -
        (gray[i - 1] ?? 0) -
        (gray[i + 1] ?? 0) -
        (gray[i - size] ?? 0) -
        (gray[i + size] ?? 0);
      lapSum += v;
      lapSq += v * v;
      n++;
    }
  }
  const mean = lapSum / n;
  const sharpness = lapSq / n - mean * mean;
  const greenRatio = green / (size * size);

  const issues: string[] = [];
  const advice: string[] = [];
  if (sharpness < 55) {
    issues.push("The photo looks blurry or out of focus.");
    advice.push("Keep the leaf still and tap the screen to focus before taking the photo.");
  }
  if (brightness < 55) {
    issues.push("The photo is quite dark.");
    advice.push("Use natural daylight, and avoid standing between the sun and the leaf.");
  }
  if (brightness > 215) {
    issues.push("The photo is over-exposed (too bright).");
    advice.push("Move out of harsh direct sunlight or use light shade.");
  }
  if (greenRatio < 0.06) {
    issues.push("Very little plant material is visible.");
    advice.push("Place one leaf close to the camera so it fills most of the frame.");
  }

  return { ok: issues.length === 0, sharpness, brightness, greenRatio, issues, advice };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image file."));
    img.src = src;
  });
}

/** Downscale + compress so uploads stay fast and small. */
export async function compressImage(file: File, max = 1024, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
