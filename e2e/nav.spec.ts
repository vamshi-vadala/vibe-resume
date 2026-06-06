import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The global header + footer appear on every page. These check a visitor can
// always get home and hop between tools from anywhere.

test.describe("global navigation", () => {
  test("header brand returns to the landing page from a tool", async ({ page }) => {
    await page.goto("/tools/linkedin-url-customizer");
    await page.getByRole("banner").getByRole("link", { name: /vibe resume home/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/resume into a website/i);
  });

  test("tools menu opens and navigates across tools", async ({ page }) => {
    await page.goto("/tools/pdf-resume-to-website");

    const toggle = page.getByRole("button", { name: /^tools/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem")).toHaveCount(7);

    await menu.getByRole("menuitem", { name: /theme picker/i }).click();
    await expect(page).toHaveURL(/\/tools\/theme-picker$/);
  });

  test("menu closes on Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /^tools/i });
    await toggle.click();
    await expect(page.getByRole("menu")).toBeVisible();
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
    await page.getByRole("button", { name: /^tools/i }).click();
    await expect(page.getByRole("menu")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("header")
      .include("footer")
      .withRules(["color-contrast"])
      .analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
