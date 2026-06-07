import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/linkedin-url-customizer";

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

test.describe("linkedin url customizer", () => {
  test("sample generates ranked URL ideas, including a keyword variant", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);

    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // recommended (first) suggestion is the clean full name
    await expect(page.locator("#result").getByText("jordan-rivera", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#result").getByText("Recommended")).toBeVisible();
    // the keyword/specialty variant appears
    await expect(page.locator("#result").getByText("jordan-rivera-full-stack-engineer")).toBeVisible();

    // the slug color resolves (accent token applied, not transparent)
    const slugColor = await page.locator("[class*=urlSlug]").first().evaluate((el) => getComputedStyle(el).color);
    expect(isTransparent(slugColor), `slug color unresolved: ${slugColor}`).toBe(false);

    // primary CTA references the produced artifact
    await expect(page.getByRole("button", { name: /claim viberesume\.in\/jordan-rivera/i })).toBeVisible();

    // sticky band stays light on its dark gradient
    const bandText = await colorOf(page, ":text('real personal site')");
    expect(await luminance(bandText), `band text not light enough: ${bandText}`).toBeGreaterThan(0.6);
  });

  test("copy button confirms it copied", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const firstCopy = page.getByRole("button", { name: /^copy linkedin\.com/i }).first();
    await firstCopy.click();
    await expect(page.getByRole("button", { name: /copied/i }).first()).toBeVisible();
  });

  test("invalid name shows a friendly error, no result", async ({ page }) => {
    await page.goto(URL);
    await page.getByPlaceholder("Jordan Rivera").fill("!!! ???");
    await page.getByRole("button", { name: /customize my url/i }).click();
    await expect(page.getByText(/enter your name/i)).toBeVisible();
    await expect(page.locator("#result")).toHaveCount(0);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
