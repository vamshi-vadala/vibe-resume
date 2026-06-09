// Photo upload helpers. We deliberately keep photos as base64 in the JSONB
// payload (same shape as the PDF-extracted headshots already stored) so this
// slice doesn't need to introduce Supabase Storage, a public bucket, RLS for
// it, or signed-URL plumbing. Migration trigger: if compressed photos
// regularly exceed ~100KB after the resize below, or if we need OG-image
// generation reusing the photo, move to Storage and store a URL string in
// resume.photoUrl (the field already accepts any string).

export const MAX_PHOTO_UPLOAD_BYTES = 8_000_000;     // 8MB raw input cap before resize
export const PHOTO_TARGET_PX = 400;                  // square output edge
export const PHOTO_JPEG_QUALITY = 0.82;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAcceptablePhotoType(type: string): boolean {
  return ACCEPTED_TYPES.has(type);
}
export function isAcceptablePhotoSize(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_PHOTO_UPLOAD_BYTES;
}

export type PhotoError = "bad_type" | "too_large" | "decode_failed" | "no_canvas";

/** Resize an uploaded image File to a center-cropped 400x400 JPEG data URL.
 *  Browser-only — touches HTMLImageElement / canvas. Throws PhotoError as
 *  string in `.message` for the caller to map to UI copy. */
export async function resizePhotoToDataUrl(file: File): Promise<string> {
  if (!isAcceptablePhotoType(file.type)) throw new Error("bad_type" satisfies PhotoError);
  if (!isAcceptablePhotoSize(file.size)) throw new Error("too_large" satisfies PhotoError);

  const url = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = () => rej(new Error("decode_failed" satisfies PhotoError));
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  const min = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - min) / 2;
  const sy = (img.naturalHeight - min) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_TARGET_PX;
  canvas.height = PHOTO_TARGET_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas" satisfies PhotoError);
  ctx.drawImage(img, sx, sy, min, min, 0, 0, PHOTO_TARGET_PX, PHOTO_TARGET_PX);
  return canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY);
}

export function photoErrorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : "";
  switch (code) {
    case "bad_type": return "Pick a JPEG, PNG, or WebP image.";
    case "too_large": return "Image is too large — pick something under 8MB.";
    case "decode_failed": return "Couldn’t read that image — try a different file.";
    case "no_canvas": return "Your browser blocked image processing.";
    default: return "Couldn’t process that image.";
  }
}
