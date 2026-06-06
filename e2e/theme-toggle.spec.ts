import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function bgLuminance(page: Page): Promise<number> {
  const c = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  const m = c.match(/\d+(\.\d+)?/g)!.map(Number);
  const [r, g, b] = m.map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const attr = (page: Page) => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
const stored = (page: Page) => page.evaluate(() => localStorage.getItem("theme"));

test.describe("site theme toggle", () => {
  test("defaults to System with no override", async ({ page }) => {
    await page.goto("/");
    expect(await attr(page)).toBeNull();
    expect(await stored(page)).toBeNull();
    await expect(page.getByRole("button", { name: "System theme" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Dark choice applies, persists, and survives reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Dark theme" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(await stored(page)).toBe("dark");
    await expect.poll(() => bgLuminance(page)).toBeLessThan(0.2); // really dark

    await page.reload(); // the init script must re-apply before paint
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => bgLuminance(page)).toBeLessThan(0.2);
  });

  test("Light choice wins even when the OS is dark", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect.poll(() => bgLuminance(page)).toBeGreaterThan(0.8); // really light
  });

  test("System clears the override", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "System theme" }).click();
    expect(await attr(page)).toBeNull();
    expect(await stored(page)).toBeNull();
  });

  test("no axe color-contrast violations when forced to each theme", async ({ page }) => {
    for (const theme of ["dark", "light"] as const) {
      await page.goto("/");
      await page.getByRole("button", { name: `${theme === "dark" ? "Dark" : "Light"} theme` }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      // axe checks static contrast — snap the color transition off so it can't
      // sample a half-faded color right after the theme switch.
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none !important}" });

      const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
      expect(violations, `${theme}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
    }
  });
});
