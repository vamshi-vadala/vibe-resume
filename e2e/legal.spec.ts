import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { path: "/privacy", h1: "Privacy Policy" },
  { path: "/terms", h1: "Terms of Service" },
  { path: "/contact", h1: "Contact" },
];

test.describe("legal & infra", () => {
  for (const p of PAGES) {
    test(`${p.path} renders with no contrast violations`, async ({ page }) => {
      await page.goto(p.path);
      await expect(page.getByRole("heading", { level: 1, name: p.h1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }

  test("footer links to privacy, terms and contact", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Contact", exact: true })).toBeVisible();
    await footer.getByRole("link", { name: "Privacy", exact: true }).click();
    await expect(page).toHaveURL(/\/privacy$/);
  });

  test("the alternate ATS slug 301-redirects to the canonical tool", async ({ page }) => {
    await page.goto("/tools/ats-plain-text-resume-converter");
    await expect(page).toHaveURL(/\/tools\/ats-plain-text-converter$/);
  });

  test("robots.txt references the sitemap", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain("sitemap.xml");
  });
});
