import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/theme-picker";

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}
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
/** Total themes, read from the deck counter "1 / N". */
async function deckSize(page: Page): Promise<number> {
  const txt = (await page.getByText(/^\s*1\s*\/\s*\d+\s*$/).first().textContent()) ?? "1 / 1";
  return Number(txt.split("/")[1].trim());
}

test.describe("dev portfolio theme picker", () => {
  test("swipe the deck, keep a theme, get a result that hands off to the resume tool", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    // the sample portfolio is visible inside the top card before any interaction
    await expect(page.getByText("Jordan Rivera").first()).toBeVisible();
    await expect(page.getByText(/1 \/ \d+/)).toBeVisible();

    // no result/CTA exists before a theme is kept
    await expect(page.locator("#result")).toHaveCount(0);

    // skip advances the counter
    await page.getByRole("button", { name: /^skip/i }).click();
    await expect(page.getByText(/2 \/ \d+/)).toBeVisible();

    // keep reveals the result with a full-size preview
    await page.getByRole("button", { name: /^keep the/i }).click();
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result").getByText(/Your theme:/)).toBeVisible();

    // the themed preview's name resolves to a real color (tokens applied)
    const nameColor = await colorOf(page, "#result h3");
    expect(isTransparent(nameColor), `preview name color unresolved: ${nameColor}`).toBe(false);

    // sticky publish band is dark in both app themes -> its text must stay light
    const bandText = await colorOf(page, ":text('Publish your resume')");
    expect(await luminance(bandText), `band text not light enough: ${bandText}`).toBeGreaterThan(0.6);

    // primary CTA hands off to the flagship PDF tool with a ?theme= param
    await page.getByRole("button", { name: /use this theme on my resume/i }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-resume-to-website\?theme=[a-z0-9-]+/);
  });

  test("no axe color-contrast violations across every theme and the result", async ({ page }) => {
    await page.goto(URL);
    const n = await deckSize(page);

    // walk the whole deck; each theme restyles the same sample, so check them all
    for (let i = 0; i < n; i++) {
      const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((nd) => nd.target.join(" ")) }));
      expect(violations, `theme card ${i + 1}/${n}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
      await page.getByRole("button", { name: /^skip/i }).click();
    }

    // and the large preview in the result
    await page.getByRole("button", { name: /^keep the/i }).click();
    await expect(page.locator("#result")).toBeVisible();
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((nd) => nd.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
