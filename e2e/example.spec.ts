import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// /example — the static trust artifact: a sample resume rendered through the
// same ResumeSite component that powers published profiles.

test.describe("example profile page", () => {
  test("renders the sample site with a CTA into the PDF tool", async ({ page }) => {
    await page.goto("/example");

    // sample site content is the real ResumeSite render
    await expect(page.getByRole("heading", { level: 1, name: "Jane Doe" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Skills" })).toBeVisible();

    // CTA hands off to the flagship tool
    await page.getByRole("link", { name: /make yours free/i }).click();
    await expect(page).toHaveURL(/\/tools\/pdf-resume-to-website$/);
  });

  test("home links to the example", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /live example/i }).click();
    await expect(page).toHaveURL(/\/example$/);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await page.goto("/example");
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
