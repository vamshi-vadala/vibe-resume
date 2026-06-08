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
/** Stub our own /api/slugs/{slug} availability endpoint. */
async function stubViberesume(page: Page, status: "available" | "taken" | "reserved" | "invalid") {
  await page.route("**/api/slugs/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status }) })
  );
}

test.describe("portfolio handle checker", () => {
  test("a free handle reads as available on both rows", async ({ page }) => {
    await stubGithub(page, 404);
    await stubViberesume(page, "available");
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    await expect(page.locator('[data-row="viberesume"]').getByText("✓ Available")).toBeVisible();
    await expect(page.locator('[data-row="github"]').getByText("✓ Available")).toBeVisible();
    // honest "check yourself" links for the platforms we can't query
    await expect(page.locator("#result").getByRole("link", { name: /linkedin check/i })).toBeVisible();
    await expect(page.locator("#result").getByRole("link", { name: /x \(twitter\)/i })).toBeVisible();
    // claim CTA references the full slug
    await expect(page.getByRole("button", { name: /claim viberesume\.in\/octocat/i })).toBeVisible();
  });

  test("a taken GitHub username reads as taken", async ({ page }) => {
    await stubGithub(page, 200);
    await stubViberesume(page, "available");
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator('[data-row="github"]').getByText("✗ Taken")).toBeVisible();
  });

  test("a taken Vibe Resume handle reads as taken and hides the claim CTA", async ({ page }) => {
    await stubGithub(page, 404);
    await stubViberesume(page, "taken");
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator('[data-row="viberesume"]').getByText("✗ Taken")).toBeVisible();
    await expect(page.getByRole("button", { name: /claim viberesume\.in/i })).toHaveCount(0);
  });

  test("invalid handle shows a friendly error, no result", async ({ page }) => {
    await stubGithub(page, 404);
    await stubViberesume(page, "available");
    await page.goto(URL);
    await page.getByPlaceholder("jordanrivera").fill("@@@");
    await page.getByRole("button", { name: /check availability/i }).click();
    await expect(page.getByText(/enter a handle/i)).toBeVisible();
    await expect(page.locator("#result")).toHaveCount(0);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await stubGithub(page, 404);
    await stubViberesume(page, "available");
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator('[data-row="github"]').getByText("✓ Available")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
