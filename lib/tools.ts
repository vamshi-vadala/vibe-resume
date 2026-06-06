// Single source of truth for the live tools. The homepage cards (grouped by
// goal), the global header dropdown and the global footer mesh all read from
// this list so they can never drift. Order = the order shown to users.

export type GroupId = "online" | "portfolio" | "brand";

export type Tool = {
  /** Route, e.g. "/tools/theme-picker". */
  href: string;
  /** Full name used on the homepage card and footer. */
  name: string;
  /** Short label for the compact header menu. */
  nav: string;
  /** One-line description for the homepage card. */
  desc: string;
  /** Which goal group this tool belongs to on the landing page. */
  group: GroupId;
};

/** Goal-based groups, in display order. */
export const TOOL_GROUPS: { id: GroupId; title: string; goal: string }[] = [
  { id: "online", title: "Get your resume online", goal: "Turn a resume, profile or GitHub into a clean personal website." },
  { id: "portfolio", title: "Make your portfolio shine", goal: "Design and write a portfolio that wins the work." },
  { id: "brand", title: "Own your personal brand", goal: "Lock in a consistent name and identity across the web." },
];

// Ordered by group (flagship-first within each) so header/footer read sensibly too.
export const TOOLS: Tool[] = [
  // — Get your resume online —
  {
    href: "/tools/pdf-resume-to-website",
    name: "PDF Resume → Website",
    nav: "PDF → Website",
    desc: "Upload a PDF resume and preview it as a clean personal website — in your browser.",
    group: "online",
  },
  {
    href: "/tools/github-to-portfolio",
    name: "GitHub → Portfolio",
    nav: "GitHub → Portfolio",
    desc: "One field: a GitHub username. Out comes a portfolio — bio, top repos and tech stack.",
    group: "online",
  },
  {
    href: "/tools/developer-resume-to-portfolio",
    name: "Developer Resume → Portfolio",
    nav: "Resume → Portfolio",
    desc: "Flip a dev resume into a portfolio — your GitHub, projects and tech stack, auto-detected.",
    group: "online",
  },
  {
    href: "/tools/ats-plain-text-converter",
    name: "ATS Plain-Text Converter",
    nav: "ATS Converter",
    desc: "See your resume the way an ATS robot reads it, with a 0–100 score and fixes.",
    group: "online",
  },

  // — Make your portfolio shine —
  {
    href: "/tools/theme-picker",
    name: "Dev Portfolio Theme Picker",
    nav: "Theme Picker",
    desc: "Swipe through portfolio themes like a deck of cards and keep the look you love.",
    group: "portfolio",
  },
  {
    href: "/tools/portfolio-about-me-generator",
    name: "Portfolio About Me Generator",
    nav: "About Me",
    desc: "Enter your role, pick a tone, and copy a polished portfolio “about me” in seconds.",
    group: "portfolio",
  },
  {
    href: "/tools/case-study-template",
    name: "Case Study Template",
    nav: "Case Study",
    desc: "Turn a project into a structured, copy-paste portfolio case study with Markdown export.",
    group: "portfolio",
  },

  // — Own your personal brand —
  {
    href: "/tools/portfolio-handle-checker",
    name: "Portfolio Handle Checker",
    nav: "Handle Checker",
    desc: "Check where @yourhandle is still free across the web and claim your portfolio URL.",
    group: "brand",
  },
  {
    href: "/tools/linkedin-url-customizer",
    name: "LinkedIn URL Customizer",
    nav: "LinkedIn URL",
    desc: "Turn your name into clean, professional custom profile URLs you can claim.",
    group: "brand",
  },
  {
    href: "/tools/resume-qr-code-generator",
    name: "Resume QR Code Generator",
    nav: "Resume QR",
    desc: "Turn your portfolio or resume link into a downloadable QR code — PNG or SVG.",
    group: "brand",
  },
];
