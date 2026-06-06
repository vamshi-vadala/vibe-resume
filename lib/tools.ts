// Single source of truth for the live tools. The homepage cards, the global
// header dropdown and the global footer mesh all read from this list so they
// can never drift out of sync. Order = the order shown to users.

export type Tool = {
  /** Route, e.g. "/tools/theme-picker". */
  href: string;
  /** Full name used on the homepage card and footer. */
  name: string;
  /** Short label for the compact header menu. */
  nav: string;
  /** One-line description for the homepage card. */
  desc: string;
};

export const TOOLS: Tool[] = [
  {
    href: "/tools/pdf-resume-to-website",
    name: "PDF Resume → Website",
    nav: "PDF → Website",
    desc: "Upload a PDF resume and preview it as a clean personal website — in your browser.",
  },
  {
    href: "/tools/ats-plain-text-converter",
    name: "ATS Plain-Text Converter",
    nav: "ATS Converter",
    desc: "See your resume the way an ATS robot reads it, with a 0–100 score and fixes.",
  },
  {
    href: "/tools/developer-resume-to-portfolio",
    name: "Developer Resume → Portfolio",
    nav: "Resume → Portfolio",
    desc: "Flip a dev resume into a portfolio — your GitHub, projects and tech stack, auto-detected.",
  },
  {
    href: "/tools/github-to-portfolio",
    name: "GitHub → Portfolio",
    nav: "GitHub → Portfolio",
    desc: "One field: a GitHub username. Out comes a portfolio — bio, top repos and tech stack.",
  },
  {
    href: "/tools/theme-picker",
    name: "Dev Portfolio Theme Picker",
    nav: "Theme Picker",
    desc: "Swipe through portfolio themes like a deck of cards and keep the look you love.",
  },
  {
    href: "/tools/linkedin-url-customizer",
    name: "LinkedIn URL Customizer",
    nav: "LinkedIn URL",
    desc: "Turn your name into clean, professional custom profile URLs you can claim.",
  },
];
