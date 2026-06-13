import type { IconId } from "@/lib/tools.ts";

// Simple monoline icons, 24px grid, inherit currentColor. Decorative — the card
// already has a text label, so each <svg> is aria-hidden.
const PATHS: Record<IconId, React.ReactNode> = {
  pdf: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 13h5M9.5 16.5h5" />
    </>
  ),
  github: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M6 8v8M18 10v1a4 4 0 0 1-4 4H8" />
    </>
  ),
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  ats: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 9l1.8 1.8L13 7.5M8 15h8" />
    </>
  ),
  palette: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l4-1L19 8l-3-3L5 16z" />
      <path d="M13.5 6.5l3 3" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M9 9h12" />
    </>
  ),
  at: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M15.6 12v1.6a2.4 2.4 0 0 0 4.8 0V12a8.4 8.4 0 1 0-3.2 6.6" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1.3 1.3" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.5 3.5 0 0 0 5 5l1.3-1.3" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h3M20.5 14v3M14 20.5h6.5M20.5 17.5v0" />
    </>
  ),
};

export default function ToolIcon({ name, size = 22 }: { name: IconId; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
