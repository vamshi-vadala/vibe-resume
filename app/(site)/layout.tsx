import SiteHeader from "@/app/SiteHeader";
import SiteFooter from "@/app/SiteFooter";
import chrome from "@/app/chrome.module.css";

// Chrome for the whole platform EXCEPT the public profile route. Lives in a
// route group so `/[slug]` (which sits outside this group, at app/[slug]) can
// render without the full header + 10-tool footer competing with the owner's
// identity. The root layout keeps only <html>/<body> + analytics, shared by
// both.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className={chrome.main}>{children}</div>
      <SiteFooter />
    </>
  );
}
