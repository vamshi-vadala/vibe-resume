import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/ats-plain-text-converter";

// relative luminance (0=black, 1=white) from a computed "rgb(r, g, b)" string
async function luminance(color: string): Promise<number> {
  const m = color.match(/\d+(\.\d+)?/g)!.map(Number);
  const [r, g, b] = m.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}

async function bgOf(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);
}
async function colorOf(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
}

test.describe("ATS converter theming", () => {
  test("semantic tokens resolve and contrast holds", async ({ page }) => {
    await page.goto(URL);

    // body background must resolve to a real color (not the unstyled transparent default)
    const bodyBg = await bgOf(page, "body");
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    // reveal the result UI (panels, recommendations, CTA band)
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // the exact bug class from before: a card referencing an undefined --panel
    // token would render transparent. Assert it resolved to a real surface color.
    const cardBg = await page.locator("#result").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(cardBg), `result card background unresolved: ${cardBg}`).toBe(false);

    // CTA band is dark in BOTH themes -> its text must stay light (the fix)
    const ctaText = await colorOf(page, ":text('publish it as a live page')");
    expect(await luminance(ctaText), `CTA text not light enough: ${ctaText}`).toBeGreaterThan(0.6);

    // "+points" badge (accent2 token) must resolve to a non-transparent color
    const badgeColor = await colorOf(page, "ol li span:has-text('+')");
    expect(isTransparent(badgeColor), `points badge color unresolved: ${badgeColor}`).toBe(false);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
