import { expect, test } from "@playwright/test";

// The public reader journey on the seeded world "The Salt Crown".

test("a reader opens a world, follows the tree and a wiki link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /The Salt Crown/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "The Salt Crown" })).toBeVisible();

  // The family tree draws every character.
  const tree = page.getByRole("figure", { name: "Family tree" });
  await expect(tree.getByText("Aster Vell")).toBeVisible();
  await expect(tree.getByText("Tobin Vell")).toBeVisible();

  // Clicking a person in the tree opens their page.
  await tree.getByText("Ren Vell").click();
  await expect(page.getByRole("heading", { level: 1, name: "Ren Vell" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mara Quill" }).first()).toBeVisible();

  // A [[link]] in the text goes to that character, whose page lists Ren as a backlink.
  await page.getByRole("link", { name: "Ilse Vell" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Ilse Vell" })).toBeVisible();
  await expect(page.locator("dt", { hasText: "Mentioned on" }).locator("..")).toContainText("Ren Vell");
});

test("readers cannot see edit controls", async ({ page }) => {
  await page.goto("/w/the-salt-crown/ren-vell");
  await expect(page.getByRole("link", { name: "Edit page" })).toHaveCount(0);
  const res = await page.goto("/w/the-salt-crown/ren-vell/edit");
  await expect(page).toHaveURL(/\/w\/the-salt-crown\/ren-vell$/);
  expect(res?.ok()).toBeTruthy();
});
