import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/case-study-template";

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}

test.describe("case study template", () => {
  test("sample builds a structured case study with metrics and steps", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);

    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const result = page.locator("#result");
    await expect(result.getByRole("heading", { name: "Checkout Redesign" })).toBeVisible();
    await expect(result.getByText("Acme Storefront").first()).toBeVisible(); // meta
    await expect(result.getByText("32%", { exact: true })).toBeVisible();    // extracted metric chip
    await expect(result.getByRole("heading", { name: "The Challenge" })).toBeVisible();
    await expect(result.getByRole("heading", { name: "The Approach" })).toBeVisible();
    await expect(result.locator("ol li").first()).toBeVisible();             // process steps
  });

  test("copy as markdown confirms it copied", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    await page.getByRole("button", { name: /copy case study as markdown/i }).click();
    await expect(page.getByRole("button", { name: /copied case study as markdown/i })).toBeVisible();
  });

  test("empty title shows a friendly error, no result", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /build my case study/i }).click();
    await expect(page.getByText(/give your project a title/i)).toBeVisible();
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
