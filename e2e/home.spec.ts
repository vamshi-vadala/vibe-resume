import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("landing page", () => {
  test("groups the tools by goal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/resume into a website/i);

    // three goal groups, each with the right number of tools
    await expect(page.getByRole("heading", { level: 2, name: "Get your resume online" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Make your portfolio shine" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Own your personal brand" })).toBeVisible();

    await expect(page.locator('section[aria-labelledby="group-online"]').getByRole("link")).toHaveCount(4);
    await expect(page.locator('section[aria-labelledby="group-portfolio"]').getByRole("link")).toHaveCount(3);
    await expect(page.locator('section[aria-labelledby="group-brand"]').getByRole("link")).toHaveCount(3);

    // a representative card links to its tool
    await page.locator('section[aria-labelledby="group-brand"]').getByRole("link", { name: /Handle Checker/ }).click();
    await expect(page).toHaveURL(/\/tools\/portfolio-handle-checker$/);
  });

  test("shows the how-it-works steps and trust signals", async ({ page }) => {
    await page.goto("/");
    for (const t of ["Pick a tool", "Paste or upload", "Copy, download or publish"]) {
      await expect(page.getByText(t, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/100% in your browser/)).toBeVisible();
    await expect(page.getByRole("link", { name: /open source/i })).toBeVisible();
  });

  test("no axe color-contrast violations on the landing page", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
