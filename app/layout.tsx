import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "./providers";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import chrome from "./chrome.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves relative OG image + canonical URLs to the production origin
  // (otherwise they fall back to http://localhost:3000 in metadata).
  metadataBase: new URL("https://vibe-resumes.vercel.app"),
  title: "Vibe Resume",
  description: "Free tools to turn your resume and profile into a shareable website.",
};

// Runs before first paint: applies a saved Light/Dark choice so there's no
// flash of the wrong theme. No saved choice = System (the CSS media query wins).
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <Analytics>
          <SiteHeader />
          <div className={chrome.main}>{children}</div>
          <SiteFooter />
        </Analytics>
      </body>
    </html>
  );
}
