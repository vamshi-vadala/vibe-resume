import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const URL = "/tools/resume-qr-code-generator";

function isTransparent(c: string) {
  return c === "transparent" || /rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(c);
}

test.describe("resume qr code generator", () => {
  test("sample renders a scannable QR with the encoded link", async ({ page }) => {
    await page.goto(URL);

    const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(isTransparent(bodyBg), `body background unresolved: ${bodyBg}`).toBe(false);

    await expect(page.locator("#result")).toHaveCount(0);

    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result")).toBeVisible();

    // an actual SVG QR is rendered, on a white frame, with an accessible label
    await expect(page.locator("#result [class*=qrFrame] svg")).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code linking to https:\/\/linkedin\.com\/in\/jordan-rivera/i })).toBeVisible();
    await expect(page.locator("#result").getByRole("link", { name: /linkedin\.com\/in\/jordan-rivera/i })).toBeVisible();
  });

  test("changing color re-renders the QR in that color", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result [class*=qrFrame] svg")).toBeVisible();

    // default Ink (#0b0d10) -> pick Blue (#1d4ed8); the new color appears in the SVG markup
    await page.getByRole("button", { name: /blue qr color/i }).click();
    await expect.poll(() => page.locator("#result [class*=qrFrame] svg").innerHTML()).toContain("#1d4ed8");
  });

  test("downloads a PNG file", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result [class*=qrFrame] svg")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download png/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^resume-qr-.*\.png$/);
  });

  test("empty input shows a friendly error, no result", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /generate qr/i }).click();
    await expect(page.getByText(/enter a link or text/i)).toBeVisible();
    await expect(page.locator("#result")).toHaveCount(0);
  });

  test("no axe color-contrast violations", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: /try a sample/i }).click();
    await expect(page.locator("#result [class*=qrFrame] svg")).toBeVisible();

    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const violations = results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
