import { test, expect } from "@playwright/test";

test("Suzanne is told plainly when no reference matched her", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Monk 7" }).check({ force: true });
  await page.getByRole("radio", { name: "Black", exact: true }).check({ force: true });
  await page.getByRole("radio", { name: "Near-black brown" }).check({ force: true });
  await page.getByRole("radio", { name: /No reliable match/ }).check({ force: true });
  await page.getByRole("button", { name: "See the suggestion" }).click();

  await expect(page.getByRole("heading", { name: "This is not a reliable answer" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your palette" })).toBeVisible();
});
