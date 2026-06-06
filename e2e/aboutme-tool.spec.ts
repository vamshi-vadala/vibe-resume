import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/portfolio-about-me-generator";

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

test.describe("portfolio about-me generator", () => {
  test("sample generates copyable variants in the chosen tone", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);

    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // the sample has a name, so all four variants appear
    await expect(page.locator("#result").getByText("One-liner")).toBeVisible();
    await expect(page.locator("#result").getByText("About section")).toBeVisible();
    await expect(page.locator("#result").getByText("Third-person bio")).toBeVisible();
    // the generated text weaves in the inputs
    await expect(page.locator("#result").getByText(/Product Designer/).first()).toBeVisible();
    await expect(page.locator("#result").getByText(/6\+ years/).first()).toBeVisible();

    // sticky band stays light on its dark gradient
    const bandText = await colorOf(page, ":text('with your own URL')");
    expect(await luminance(bandText), `band text not light enough: ${bandText}`).toBeGreaterThan(0.6);
  });

  test("switching tone rewrites the about section instantly", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const aboutText = () => page.locator("[class*=variantText]").nth(1).innerText();
    const before = await aboutText();
    await page.getByRole("button", { name: "Creative", exact: true }).click();
    await expect.poll(aboutText).not.toBe(before);
    await expect(page.getByRole("button", { name: "Creative", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("copy confirms it copied", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    await page.getByRole("button", { name: /^copy the one-liner/i }).click();
    await expect(page.getByRole("button", { name: /copied the one-liner/i })).toBeVisible();
  });

  test("missing role shows a friendly error, no result", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /write my about me/i }).click();
    await expect(page.getByText(/tell us your role/i)).toBeVisible();
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
