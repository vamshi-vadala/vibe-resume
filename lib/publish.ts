// Pure validator for the publish payload stored in slugs.resume_data (JSONB).
// Used by PATCH /api/slugs/[slug] and re-used to defensively parse rows on
// render. Tolerant of partial/legacy shapes; never throws.
//
// PublishPayload is a discriminated union keyed on `kind`:
//   - "resume"     — PDF-parsed ResumeData (slice 1). Default for missing kind
//                    (every row written before kinds existed is "resume").
//   - "developer"  — Developer Resume → Portfolio (#3): DevProfile + repos
//   - "github"     — GitHub → Portfolio (#7): GhProfile (data is already public)
//
// Only "resume" has an in-app editor today. Settings/edit is gated to kind
// "resume"; the other two re-publish from their source tool to change.

import type { ResumeData } from "./resume.ts";
import type { DevProfile } from "./devresume.ts";
import type { GhProfile } from "./ghportfolio.ts";
import type { Repo } from "./github.ts";

export type PublishKind = "resume" | "developer" | "github";

export interface ResumePayload {
  kind: "resume";
  resume: ResumeData;
  photoUrl: string;
  themeId: string;
  /** Owner's "what I'm looking for" line shown above the resume with a
   *  Get-in-touch CTA (e.g. "Open to senior design roles · Remote / SF").
   *  Optional — legacy rows and other tools have none. */
  availability?: string;
}
export interface DeveloperPayload {
  kind: "developer";
  profile: DevProfile;
  repos: Repo[];          // live-pulled GitHub repos snapshot at publish time
  themeId: string;
}
export interface GithubPayload {
  kind: "github";
  profile: GhProfile;
  themeId: string;
}
export type PublishPayload = ResumePayload | DeveloperPayload | GithubPayload;

const MAX_TOTAL_BYTES = 300_000;        // ~300KB JSON; photo data URL dominates
const MAX_STRING = 20_000;               // any single string field except photoUrl
const MAX_PHOTO_DATA_URL = 200_000;      // base64 of a 400x400 q0.82 JPEG ~30–60KB; leave headroom for PDF-extracted photos
const MAX_ARRAY = 200;                   // bullets / items / skills cap

function isStr(v: unknown, max = MAX_STRING): v is string {
  return typeof v === "string" && v.length <= max;
}
function isOptStr(v: unknown): boolean {
  return v === undefined || v === null || isStr(v);
}
function isStrArr(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= MAX_ARRAY && v.every((x) => isStr(x));
}
function isOptNumber(v: unknown): boolean {
  return v === undefined || v === null || typeof v === "number";
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

function validateRepoArray(v: unknown): v is Repo[] {
  if (!Array.isArray(v) || v.length > MAX_ARRAY) return false;
  for (const r of v) {
    if (!r || typeof r !== "object") return false;
    const x = r as Record<string, unknown>;
    if (!isStr(x.owner) || !isStr(x.name) || !isStr(x.url)) return false;
    if (!isOptStr(x.description)) return false;
    if (!isOptNumber(x.stars)) return false;
    if (!isOptStr(x.language)) return false;
    if (!isOptStr(x.homepage)) return false;
    if (!isOptStr(x.thumbnail)) return false;
    if (x.topics !== undefined && x.topics !== null && !isStrArr(x.topics)) return false;
  }
  return true;
}

function validateDevProfile(p: unknown): p is DevProfile {
  if (!p || typeof p !== "object") return false;
  const d = p as Record<string, unknown>;
  if (!isStr(d.name)) return false;
  if (!isStr(d.headline)) return false;
  if (!isStr(d.summary)) return false;
  if (d.githubUrl !== null && !isStr(d.githubUrl)) return false;
  if (!isStrArr(d.profiles)) return false;
  if (!isStrArr(d.stack)) return false;
  if (!isStrArr(d.projects)) return false;
  if (typeof d.empty !== "boolean") return false;
  if (!Array.isArray(d.links) || d.links.length > MAX_ARRAY) return false;
  for (const l of d.links) {
    if (!l || typeof l !== "object") return false;
    const lk = l as Record<string, unknown>;
    if (!isStr(lk.kind) || !isStr(lk.label) || !isStr(lk.url)) return false;
  }
  if (!validateRepoArray(d.repos)) return false;
  if (!Array.isArray(d.experience) || d.experience.length > MAX_ARRAY) return false;
  for (const e of d.experience) {
    if (!e || typeof e !== "object") return false;
    const en = e as Record<string, unknown>;
    if (!isStr(en.header)) return false;
    if (en.meta !== undefined && !isStr(en.meta)) return false;
    if (!isStrArr(en.bullets)) return false;
  }
  return true;
}

function validateGhProfile(p: unknown): p is GhProfile {
  if (!p || typeof p !== "object") return false;
  const d = p as Record<string, unknown>;
  if (!isStr(d.username) || !isStr(d.name) || !isStr(d.headline) || !isStr(d.about)) return false;
  if (!isStr(d.avatarUrl) || !isStr(d.githubUrl)) return false;
  if (d.company !== null && !isStr(d.company)) return false;
  if (d.location !== null && !isStr(d.location)) return false;
  if (typeof d.followers !== "number" || typeof d.publicRepos !== "number") return false;
  if (!isStrArr(d.topLanguages) || !isStrArr(d.stack)) return false;
  if (typeof d.empty !== "boolean") return false;
  if (!Array.isArray(d.links) || d.links.length > MAX_ARRAY) return false;
  for (const l of d.links) {
    if (!l || typeof l !== "object") return false;
    const lk = l as Record<string, unknown>;
    if (!isStr(lk.kind) || !isStr(lk.label) || !isStr(lk.url)) return false;
  }
  if (!validateRepoArray(d.repos)) return false;
  return true;
}

export type ValidationResult =
  | { ok: true; payload: PublishPayload }
  | { ok: false; reason: "too_large" | "bad_shape" | "bad_resume" | "bad_theme" | "bad_developer" | "bad_github" | "bad_kind" };

export function validatePublishPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "bad_shape" };
  // Size guard before deep validation — JSON.stringify is cheaper than per-key crawl.
  try {
    const size = JSON.stringify(raw).length;
    if (size > MAX_TOTAL_BYTES) return { ok: false, reason: "too_large" };
  } catch { return { ok: false, reason: "bad_shape" }; }

  const d = raw as Record<string, unknown>;
  if (typeof d.themeId !== "string" || d.themeId.length > 64) return { ok: false, reason: "bad_theme" };

  // Missing kind = "resume" (rows written before kinds existed). Explicit kind
  // must be one of the known values; anything else is an error rather than a
  // silent fallback so we never accidentally render a bad shape.
  const kind = (d.kind ?? "resume") as string;

  if (kind === "resume") {
    if (typeof d.photoUrl !== "string" || d.photoUrl.length > MAX_PHOTO_DATA_URL) {
      return { ok: false, reason: "bad_shape" };
    }
    if (!validateResume(d.resume)) return { ok: false, reason: "bad_resume" };
    if (d.availability !== undefined && !isStr(d.availability)) return { ok: false, reason: "bad_shape" };
    const payload: ResumePayload = { kind: "resume", resume: d.resume as ResumeData, photoUrl: d.photoUrl, themeId: d.themeId };
    if (isStr(d.availability) && d.availability.trim()) payload.availability = d.availability.trim();
    return { ok: true, payload };
  }

  if (kind === "developer") {
    if (!validateDevProfile(d.profile)) return { ok: false, reason: "bad_developer" };
    if (!validateRepoArray(d.repos)) return { ok: false, reason: "bad_developer" };
    return { ok: true, payload: { kind: "developer", profile: d.profile as DevProfile, repos: d.repos as Repo[], themeId: d.themeId } };
  }

  if (kind === "github") {
    if (!validateGhProfile(d.profile)) return { ok: false, reason: "bad_github" };
    return { ok: true, payload: { kind: "github", profile: d.profile as GhProfile, themeId: d.themeId } };
  }

  return { ok: false, reason: "bad_kind" };
}
