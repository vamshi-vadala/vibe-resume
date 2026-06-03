import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/pdf-resume-to-website";

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}
// relative luminance (0=black, 1=white) from a computed "rgb(r, g, b)" string
async function luminance(color: string): Promise<number> {
  const m = color.match(/\d+(\.\d+)?/g)!.map(Number);
  const [r, g, b] = m.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
async function colorOf(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
}

test.describe("PDF→website tool theming", () => {
  test("sample renders the website preview with resolved surfaces", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    // "Try a sample" needs no PDF fixture and exercises the full preview render
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // the generated site name must be a real, non-transparent text color
    const nameColor = await colorOf(page, "#result h1");
    expect(isTransparent(nameColor), `site name color unresolved: ${nameColor}`).toBe(false);

    // avatar uses the accent token as a background — must resolve
    const avatarBg = await page.locator("#result h1").locator("xpath=../../div[1]").evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(isTransparent(avatarBg), `avatar background unresolved: ${avatarBg}`).toBe(false);

    // CTA band is dark in BOTH themes -> its text must stay light
    const ctaText = await colorOf(page, ":text('publish it with your own URL')");
    expect(await luminance(ctaText), `CTA text not light enough: ${ctaText}`).toBeGreaterThan(0.6);
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
