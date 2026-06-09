"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES } from "@/lib/themes.ts";
import type { PublishPayload } from "@/lib/publish.ts";

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
  const [newContact, setNewContact] = useState("");
  const [themeId, setThemeId] = useState(initial.themeId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [unpublishing, setUnpublishing] = useState(false);

  function addContact() {
    const v = newContact.trim();
    if (!v) return;
    setContacts((c) => [...c, v]);
    setNewContact("");
  }
  function removeContact(i: number) {
    setContacts((c) => c.filter((_, n) => n !== i));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setError("");
    const payload: PublishPayload = {
      ...initial,
      themeId,
      resume: {
        ...initial.resume,
        name: name.trim(),
        title: title.trim(),
        summary: summary.trim(),
        contactLines: contacts,
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

      <div>
        <span style={labelStyle}>Contact links</span>
        {contacts.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "grid", gap: 6 }}>
            {contacts.map((c, i) => (
              <li
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, padding: "8px 12px", border: "1px solid var(--line)",
                  borderRadius: 8, background: "var(--panel)",
                  fontSize: 14,
                }}
              >
                <span style={{ wordBreak: "break-all" }}>{c}</span>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  aria-label={`Remove ${c}`}
                  style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 }}
                >×</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addContact(); } }}
            placeholder="email, phone, or URL"
            style={fieldStyle}
            aria-label="Add a contact link"
          />
          <button
            type="button"
            onClick={addContact}
            style={{
              padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >Add</button>
        </div>
      </div>

      <div>
        <span style={labelStyle}>Theme</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          <ThemeOption id="" name="Default" current={themeId} onPick={setThemeId} />
          {THEMES.map((t) => (
            <ThemeOption key={t.id} id={t.id} name={t.name} current={themeId} onPick={setThemeId} />
          ))}
        </div>
      </div>

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
