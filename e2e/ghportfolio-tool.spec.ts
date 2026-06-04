import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/github-to-portfolio";

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

// 1x1 transparent png so the avatar/thumbnails never hit the network during tests.
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const RAW_PNG = Buffer.from(PNG.split(",")[1], "base64");
const MOCK_USER = {
  login: "sindresorhus", name: "Sindre Sorhus", bio: "Full-Time Open-Sourcerer",
  avatar_url: PNG, html_url: "https://github.com/sindresorhus", blog: "https://sindresorhus.com",
  company: null, location: "Oslo", followers: 50000, public_repos: 1000, twitter_username: "sindresorhus",
};
const MOCK_REPOS = [
  { name: "ky", html_url: "https://github.com/sindresorhus/ky", description: "Tiny HTTP client", stargazers_count: 12000, language: "TypeScript", fork: false, archived: false, homepage: "https://ky.dev", topics: ["http", "fetch"], pushed_at: "2025-01-01T00:00:00Z", owner: { login: "sindresorhus" } },
  { name: "ow", html_url: "https://github.com/sindresorhus/ow", description: "Argument validation", stargazers_count: 3700, language: "TypeScript", fork: false, archived: false, homepage: null, topics: [], pushed_at: "2025-01-01T00:00:00Z", owner: { login: "sindresorhus" } },
  { name: "a-fork", html_url: "https://github.com/sindresorhus/a-fork", description: null, stargazers_count: 99999, language: "C", fork: true, archived: false, owner: { login: "sindresorhus" } },
];
const README_MD = "# Hi\n\nI build open-source tools used by millions of developers.\n\n## Projects\n";
const MOCK_README = { content: Buffer.from(README_MD).toString("base64"), encoding: "base64" };

test.describe("github → portfolio tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**://api.github.com/**", (route) => {
      const url = route.request().url();
      const body = url.includes("/readme") ? MOCK_README : url.includes("/repos") ? MOCK_REPOS : MOCK_USER;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    // Repo social-preview thumbnails — keep them off the network.
    await page.route("**://opengraph.githubassets.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: RAW_PNG })
    );
  });

  test("sample renders the portfolio with bio, stack and top repos", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    const nameColor = await colorOf(page, "#result h1");
    expect(isTransparent(nameColor), `portfolio name color unresolved: ${nameColor}`).toBe(false);

    await expect(page.locator("#result").getByText("Sindre Sorhus")).toBeVisible();
    await expect(page.locator("#result").getByText("Full-Time Open-Sourcerer")).toBeVisible(); // headline (bio)
    await expect(page.locator("#result").getByText(/I build open-source tools/)).toBeVisible(); // About from README
    await expect(page.locator("#result").getByText("Tech stack")).toBeVisible();
    await expect(page.locator("#result").getByText("Featured projects")).toBeVisible();
    await expect(page.locator("#result").getByText("ky", { exact: true })).toBeVisible();
    await expect(page.locator("#result").getByText("★ 12,000")).toBeVisible();
    await expect(page.locator("#result").getByText("http", { exact: true })).toBeVisible(); // topic chip
    await expect(page.locator("#result").getByRole("link", { name: /live demo/i })).toBeVisible();
    await expect(page.locator("#result").locator("img").first()).toBeVisible();         // thumbnails render
    await expect(page.locator("#result").getByText("a-fork")).toHaveCount(0);           // forks dropped

    const ctaText = await colorOf(page, ":text('publish it with your own URL')");
    expect(await luminance(ctaText), `CTA text not light enough: ${ctaText}`).toBeGreaterThan(0.6);
  });

  test("invalid username shows a friendly error, no result", async ({ page }) => {
    await page.goto(URL);
    await page.getByPlaceholder("octocat").fill("not a valid handle!!");
    await page.getByRole("button", { name: /build my portfolio/i }).click();
    await expect(page.getByText(/enter a valid github username/i)).toBeVisible();
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
