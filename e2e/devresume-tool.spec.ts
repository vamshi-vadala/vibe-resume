import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/developer-resume-to-portfolio";

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

// Deterministic, offline GitHub: every test stubs api.github.com so the suite
// never depends on the live API (rate limits / network) and we can assert the
// live-pull rendering exactly.
const MOCK_REPOS = [
  { name: "awesome-lib", html_url: "https://github.com/alexrivera/awesome-lib", description: "A handy library.", stargazers_count: 142, language: "Rust", fork: false, archived: false, owner: { login: "alexrivera" } },
  { name: "a-fork", html_url: "https://github.com/alexrivera/a-fork", description: null, stargazers_count: 9999, language: "C", fork: true, archived: false, owner: { login: "alexrivera" } },
];

test.describe("developer resume→portfolio tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**://api.github.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REPOS) })
    );
  });

  test("sample renders the portfolio preview with stack and projects", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    // "Try a sample" exercises the full portfolio render — no fixture needed
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // generated portfolio name must be a real, non-transparent text color
    const nameColor = await colorOf(page, "#result h1");
    expect(isTransparent(nameColor), `portfolio name color unresolved: ${nameColor}`).toBe(false);

    // the detected tech stack, experience and project repos must render
    await expect(page.locator("#result").getByText("Tech stack")).toBeVisible();
    await expect(page.locator("#result").getByText("Experience")).toBeVisible();
    await expect(page.locator("#result").getByText("Senior Software Engineer — Stripe")).toBeVisible();
    await expect(page.locator("#result").getByText("Projects")).toBeVisible();
    // resume-listed repo (always shown) and the live-pulled repo (from the stubbed API)
    await expect(page.locator("#result").getByText("ratelimit-go", { exact: true })).toBeVisible();
    await expect(page.locator("#result").getByText("awesome-lib", { exact: true })).toBeVisible();
    await expect(page.locator("#result").getByText("★ 142")).toBeVisible();
    await expect(page.locator("#result").getByText("a-fork")).toHaveCount(0); // forks dropped

    // (CTA-band luminance check removed 2026-06-10 — see pdf-tool.spec.ts
    // for the rationale. Axe color-contrast in the next test covers it.)
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
