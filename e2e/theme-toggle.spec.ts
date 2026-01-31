import { test, expect } from '@playwright/test';

test.describe('Theme Toggle (FR-6.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('theme toggle switches between light and dark modes', async ({ page }) => {
    // Wait for the theme toggle to be visible
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();

    // Get the html element to check data-theme attribute
    const html = page.locator('html');

    // Open the dropdown menu
    await themeToggle.click();

    // Select dark mode
    const darkOption = page.getByRole('menuitem', { name: /dark/i });
    await expect(darkOption).toBeVisible();
    await darkOption.click();

    // Verify dark mode is applied
    await expect(html).toHaveClass(/dark/);

    // Re-open dropdown and select light mode
    await themeToggle.click();
    const lightOption = page.getByRole('menuitem', { name: /light/i });
    await expect(lightOption).toBeVisible();
    await lightOption.click();

    // Verify light mode is applied (dark class removed)
    await expect(html).not.toHaveClass(/dark/);
  });

  test('theme toggle supports system preference', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();

    // Open the dropdown menu
    await themeToggle.click();

    // Select system mode
    const systemOption = page.getByRole('menuitem', { name: /system/i });
    await expect(systemOption).toBeVisible();
    await systemOption.click();

    // System mode selected - dropdown closed successfully
    await expect(systemOption).not.toBeVisible();
  });
});
