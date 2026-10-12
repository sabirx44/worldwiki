import { expect, test } from "@playwright/test";

// Every page a signed-out visitor can open must be clean: no console errors,
// no failed requests, exactly one h1, and nothing that scrolls sideways.
const pages = ["/", "/login", "/notes", "/w/the-salt-crown", "/w/the-salt-crown/ren-vell", "/w/the-salt-crown/ilse-vell"];

for (const path of pages) {
  test(`signed-out visitor: ${path} is clean`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

    await page.goto(path);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toHaveCount(1);
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sideways).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
