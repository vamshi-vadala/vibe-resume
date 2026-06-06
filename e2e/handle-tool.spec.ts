import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/portfolio-handle-checker";

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}
/** Stub the GitHub users API with a fixed status. */
async function stubGithub(page: Page, status: number) {
  await page.route("**://api.github.com/**", (route) =>
    route.fulfill({ status, contentType: "application/json", body: status === 200 ? JSON.stringify({ login: "x" }) : "{}" })
  );
}

test.describe("portfolio handle checker", () => {
  test("a free GitHub username reads as available", async ({ page }) => {
    await stubGithub(page, 404);
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    await expect(page.getByText("✓ Available")).toBeVisible();
    // honest "check yourself" links for the platforms we can't query
    await expect(page.locator("#result").getByRole("link", { name: /linkedin/i })).toBeVisible();
    await expect(page.locator("#result").getByRole("link", { name: /x \(twitter\)/i })).toBeVisible();
    // claim CTA references the handle
    await expect(page.getByRole("button", { name: /claim @jordanrivera/i })).toBeVisible();
  });

  test("a taken GitHub username reads as taken", async ({ page }) => {
    await stubGithub(page, 200);
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.getByText("✗ Taken")).toBeVisible();
  });

  test("invalid handle shows a friendly error, no result", async ({ page }) => {
    await stubGithub(page, 404);
    await page.goto(URL);
    await page.getByPlaceholder("jordanrivera").fill("@@@");
    await page.getByRole("button", { name: /check availability/i }).click();
    await expect(page.getByText(/enter a handle/i)).toBeVisible();
    await expect(page.locator("#result")).toHaveCount(0);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await stubGithub(page, 404);
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.getByText("✓ Available")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
