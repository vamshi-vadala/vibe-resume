// Pure helpers for the Resume QR Code Generator (Tool #8).
//
// The QR encoding itself is delegated to the `qrcode` library in the client
// component; the testable logic here is input normalization and filenames.

/** Lowercase slug for filenames: alphanumerics, hyphen-separated. */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Turn user input into the string we encode. A bare domain gets https://;
 * anything that already has a scheme (https:, mailto:, tel:) is left alone;
 * free text with no domain shape passes through unchanged.
 */
export function normalizeUrl(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;        // already has a scheme
  if (/^[^\s]+\.[^\s]{2,}$/.test(s)) return `https://${s}`; // looks like a domain
  return s;                                            // plain text
}

/** Non-empty and within a sane length for a QR payload. */
export function isValidQrInput(raw: string | undefined): boolean {
  const s = (raw ?? "").trim();
  return s.length > 0 && s.length <= 2000;
}

/** A friendly download filename derived from the destination. */
export function qrFilename(raw: string, ext: "png" | "svg"): string {
  const normalized = normalizeUrl(raw);
  let base = "";
  try {
    const u = new URL(normalized);
    base = slug(`${u.hostname.replace(/^www\./, "")} ${u.pathname}`);
  } catch {
    base = slug(raw ?? "");
  }
  base = base.slice(0, 40).replace(/-+$/, "") || "code";
  return `resume-qr-${base}.${ext}`;
}
