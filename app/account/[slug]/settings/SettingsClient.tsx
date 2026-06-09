"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes.ts";
import type { PublishPayload } from "@/lib/publish.ts";
import { resizePhotoToDataUrl, photoErrorMessage } from "@/lib/photo.ts";

type SaveState = "idle" | "saving" | "saved" | "error";

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 15,
  border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)",
  fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
};
const linkBtnStyle: React.CSSProperties = {
  background: "none", border: 0, color: "var(--accent)", cursor: "pointer",
  font: "inherit", padding: 0, textDecoration: "underline",
};

export default function SettingsClient({
  slug, initial, isLive,
}: {
  slug: string;
  initial: PublishPayload;
  isLive: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.resume.name);
  const [title, setTitle] = useState(initial.resume.title);
  const [summary, setSummary] = useState(initial.resume.summary);
  const [contacts, setContacts] = useState<string[]>(initial.resume.contactLines);
  const [skills, setSkills] = useState<string[]>(initial.resume.skills);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [themeId, setThemeId] = useState(initial.themeId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [unpublishing, setUnpublishing] = useState(false);

  async function onPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";  // allow re-picking the same file
    if (!f) return;
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const url = await resizePhotoToDataUrl(f);
      setPhotoUrl(url);
    } catch (err) {
      setPhotoError(photoErrorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setError("");
    const payload: PublishPayload = {
      ...initial,
      themeId,
      photoUrl,
      resume: {
        ...initial.resume,
        name: name.trim(),
        title: title.trim(),
        summary: summary.trim(),
        contactLines: contacts,
        skills,
      },
    };
    const res = await fetch(`/api/slugs/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || `save failed (${res.status})`);
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    router.refresh();
  }

  async function unpublish() {
    if (!confirm(`Unpublish viberesume.in/${slug}? Your data is kept and you can re-publish anytime. The handle stays yours.`)) return;
    setUnpublishing(true);
    setError("");
    const res = await fetch(`/api/slugs/${slug}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || `unpublish failed (${res.status})`);
      setUnpublishing(false);
      return;
    }
    router.push("/account?unpublished=" + slug);
    router.refresh();
  }

  return (
    <form onSubmit={save} style={{ display: "grid", gap: 20 }}>
      <div>
        <span style={labelStyle}>Photo</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            aria-hidden
            style={{
              width: 84, height: 84, borderRadius: "50%", overflow: "hidden",
              background: "var(--panel2)", border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--muted)", fontSize: 28, fontWeight: 700, flexShrink: 0,
            }}
          >
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span>{(name.trim()[0] || "·").toUpperCase()}</span>}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: 14,
                background: "var(--panel2)", color: "var(--text)",
                border: "1px solid var(--line)", cursor: photoBusy ? "default" : "pointer",
                opacity: photoBusy ? 0.6 : 1, width: "fit-content",
              }}
            >
              {photoBusy ? "Processing…" : (photoUrl ? "Replace photo" : "Upload photo")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoFile}
                disabled={photoBusy}
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
              />
            </label>
            {photoUrl && (
              <button type="button" onClick={() => setPhotoUrl("")} style={{ ...linkBtnStyle, fontSize: 13, color: "var(--muted)" }}>
                Remove photo
              </button>
            )}
            <span style={{ color: "var(--muted)", fontSize: 12 }}>
              JPEG/PNG/WebP, up to 8MB. We resize to 400×400.
            </span>
            {photoError && (
              <span role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 13 }}>{photoError}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="name" style={labelStyle}>Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} required />
      </div>

      <div>
        <label htmlFor="title" style={labelStyle}>Headline / role</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} placeholder="Senior Product Designer" />
      </div>

      <div>
        <label htmlFor="summary" style={labelStyle}>About</label>
        <textarea
          id="summary" value={summary} onChange={(e) => setSummary(e.target.value)}
          rows={4} style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }}
        />
      </div>

      <ChipList
        label="Contact links"
        items={contacts}
        onChange={setContacts}
        placeholder="email, phone, or URL"
        ariaAdd="Add a contact link"
      />

      <ChipList
        label="Skills"
        items={skills}
        onChange={setSkills}
        placeholder="e.g. Figma, React, Prototyping"
        ariaAdd="Add a skill"
      />

      <div>
        <span style={labelStyle}>Theme</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          <ThemeOption id="" name="Default" current={themeId} onPick={setThemeId} />
          {THEMES.map((t) => (
            <ThemeOption key={t.id} id={t.id} name={t.name} current={themeId} onPick={setThemeId} />
          ))}
        </div>
      </div>

      <SectionsPreview sections={initial.resume.sections} />

      {error && (
        <p role="alert" style={{ color: "var(--danger, #e5484d)", fontSize: 14 }}>{error}</p>
      )}
      {saveState === "saved" && (
        <p role="status" style={{ color: "var(--accent)", fontSize: 14, fontWeight: 600 }}>
          ✓ Saved. Changes are live.
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", paddingTop: 8 }}>
        <button
          type="submit"
          disabled={saveState === "saving"}
          style={{
            padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            background: "var(--accent2)", color: "var(--on-accent2)", border: 0,
            cursor: saveState === "saving" ? "default" : "pointer",
            opacity: saveState === "saving" ? 0.7 : 1,
          }}
        >
          {saveState === "saving" ? "Saving…" : "Save changes"}
        </button>
        {isLive && (
          <button
            type="button"
            onClick={unpublish}
            disabled={unpublishing}
            style={{
              padding: "12px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14,
              background: "none", color: "var(--muted)", border: "1px solid var(--line)",
              cursor: unpublishing ? "default" : "pointer", marginLeft: "auto",
            }}
          >
            {unpublishing ? "Unpublishing…" : "Unpublish"}
          </button>
        )}
      </div>
    </form>
  );
}

function ChipList({
  label, items, onChange, placeholder, ariaAdd,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  ariaAdd: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }
  function remove(i: number) {
    onChange(items.filter((_, n) => n !== i));
  }
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      {items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "grid", gap: 6 }}>
          {items.map((c, i) => (
            <li
              key={i}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 10, padding: "8px 12px", border: "1px solid var(--line)",
                borderRadius: 8, background: "var(--panel)", fontSize: 14,
              }}
            >
              <span style={{ wordBreak: "break-all" }}>{c}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${c}`}
                style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 }}
              >×</button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={fieldStyle}
          aria-label={ariaAdd}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >Add</button>
      </div>
    </div>
  );
}

function SectionsPreview({ sections }: { sections: PublishPayload["resume"]["sections"] }) {
  if (!sections || sections.length === 0) return null;
  return (
    <div>
      <span style={labelStyle}>Resume sections</span>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0, marginBottom: 10, lineHeight: 1.5 }}>
        Experience, education, and project content is read-only here.{" "}
        <Link href="/tools/pdf-resume-to-website" style={{ color: "var(--accent)" }}>
          Re-upload your PDF
        </Link>{" "}
        and publish to replace these sections.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {sections.map((s, i) => {
          const count = s.entries?.length ?? s.items.length;
          const noun = s.entries ? (count === 1 ? "role" : "roles") : (count === 1 ? "item" : "items");
          return (
            <li
              key={i}
              style={{
                padding: "10px 14px", border: "1px solid var(--line)",
                borderRadius: 8, background: "var(--panel)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 600 }}>{s.heading}</span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>{count} {noun}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ThemeOption({ id, name, current, onPick }: { id: string; name: string; current: string; onPick: (id: string) => void }) {
  const selected = id === current;
  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      aria-pressed={selected}
      style={{
        padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600,
        background: selected ? "var(--accent2)" : "var(--panel2)",
        color: selected ? "var(--on-accent2)" : "var(--text)",
        border: `1px solid ${selected ? "var(--accent2)" : "var(--line)"}`,
        cursor: "pointer", textAlign: "left",
      }}
    >{name}</button>
  );
}
