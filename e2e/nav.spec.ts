import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The global header + footer appear on every page. These check a visitor can
// always get home and hop between tools from anywhere.

/** Open the Tools menu, retrying the click until it actually opens — Next's dev
 *  server (what CI runs) can attach the React onClick a beat after the button is
 *  clickable, so a single click can land before hydration and no-op. */
async function openToolsMenu(page: Page) {
  const toggle = page.getByRole("button", { name: /^tools/i });
  await expect(toggle).toBeVisible();
  await expect(async () => {
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  return toggle;
}

test.describe("global navigation", () => {
  test("header brand returns to the landing page from a tool", async ({ page }) => {
    await page.goto("/tools/linkedin-url-customizer");
    await page.getByRole("banner").getByRole("link", { name: /vibe resume home/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/resume into a website/i);
  });

  test("tools menu opens and navigates across tools", async ({ page }) => {
    await page.goto("/tools/pdf-resume-to-website");

    await expect(page.getByRole("button", { name: /^tools/i })).toHaveAttribute("aria-expanded", "false");
    await openToolsMenu(page);

    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveCount(10);

    await menu.getByRole("menuitem", { name: /theme picker/i }).click();
    await expect(page).toHaveURL(/\/tools\/theme-picker$/);
  });

  test("menu closes on Escape", async ({ page }) => {
    await page.goto("/");
    await openToolsMenu(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("footer links to every tool and home", async ({ page }) => {
    await page.goto("/tools/github-to-portfolio");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "LinkedIn URL Customizer" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Dev Portfolio Theme Picker" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  });

  test("no axe color-contrast violations in the chrome", async ({ page }) => {
    await page.goto("/");
    await openToolsMenu(page);

    const results = await new AxeBuilder({ page })
      .include("header")
      .include("footer")
      .withRules(["color-contrast"])
      .analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
