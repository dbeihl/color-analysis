import { test, expect } from "@playwright/test";

test("David gets a palette suggestion from close-match references", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Monk 3" }).check({ force: true });
  await page.getByRole("radio", { name: "Dark brown", exact: true }).first().check({ force: true });
  await page.getByRole("radio", { name: /A close match/ }).check({ force: true });
  await page.getByRole("button", { name: "See the suggestion" }).click();

  await expect(page.getByText("Nearest palette recipe")).toBeVisible();
  await expect(page.getByText("Score separation", { exact: true })).toBeVisible();
  const palette = page.getByRole("region", { name: "Your palette" });
  await expect(palette).toBeVisible();
  expect(await palette.getByRole("listitem").count()).toBeGreaterThan(0);
});
