// Pure validator for the publish payload stored in slugs.resume_data (JSONB).
// Used by PATCH /api/slugs/[slug] and re-used to defensively parse rows on
// render. Tolerant of partial/legacy shapes; never throws.

import type { ResumeData } from "./resume.ts";

export interface PublishPayload {
  resume: ResumeData;
  photoUrl: string;
  themeId: string;
}

const MAX_TOTAL_BYTES = 300_000;   // ~300KB JSON; photo data URL dominates
const MAX_STRING = 20_000;          // any single string field (incl. photoUrl)
const MAX_ARRAY = 200;              // bullets / items / skills cap

function isStr(v: unknown, max = MAX_STRING): v is string {
  return typeof v === "string" && v.length <= max;
}
function isStrArr(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= MAX_ARRAY && v.every((x) => isStr(x));
}

function validateResume(r: unknown): r is ResumeData {
  if (!r || typeof r !== "object") return false;
  const d = r as Record<string, unknown>;
  if (!isStr(d.name)) return false;
  if (!isStr(d.title)) return false;
  if (!isStrArr(d.contactLines)) return false;
  if (!isStr(d.summary)) return false;
  if (!isStrArr(d.skills)) return false;
  if (typeof d.empty !== "boolean") return false;
  if (!Array.isArray(d.sections) || d.sections.length > MAX_ARRAY) return false;
  for (const s of d.sections) {
    if (!s || typeof s !== "object") return false;
    const sec = s as Record<string, unknown>;
    if (!isStr(sec.heading)) return false;
    if (!isStrArr(sec.items)) return false;
    if (sec.entries !== undefined) {
      if (!Array.isArray(sec.entries) || sec.entries.length > MAX_ARRAY) return false;
      for (const e of sec.entries) {
        if (!e || typeof e !== "object") return false;
        const en = e as Record<string, unknown>;
        if (!isStr(en.header)) return false;
        if (en.meta !== undefined && !isStr(en.meta)) return false;
        if (!isStrArr(en.bullets)) return false;
      }
    }
  }
  return true;
}

export type ValidationResult =
  | { ok: true; payload: PublishPayload }
  | { ok: false; reason: "too_large" | "bad_shape" | "bad_resume" | "bad_theme" };

export function validatePublishPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "bad_shape" };
  // Size guard before deep validation — JSON.stringify is cheaper than per-key crawl.
  try {
    const size = JSON.stringify(raw).length;
    if (size > MAX_TOTAL_BYTES) return { ok: false, reason: "too_large" };
  } catch { return { ok: false, reason: "bad_shape" }; }

  const d = raw as Record<string, unknown>;
  if (!isStr(d.photoUrl)) return { ok: false, reason: "bad_shape" };
  if (typeof d.themeId !== "string" || d.themeId.length > 64) return { ok: false, reason: "bad_theme" };
  if (!validateResume(d.resume)) return { ok: false, reason: "bad_resume" };
  return { ok: true, payload: { resume: d.resume as ResumeData, photoUrl: d.photoUrl, themeId: d.themeId } };
}
