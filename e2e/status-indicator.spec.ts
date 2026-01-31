import { test, expect } from '@playwright/test';

test.describe('Status Indicator (FR-1.1, FR-1.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('status indicator displays Idle with gray color and no pulse', async ({ page }) => {
    // Status indicator should show Idle (default)
    const statusIndicator = page.locator('text=Idle');
    await expect(statusIndicator).toBeVisible();

    // Verify model name is displayed beneath status indicator (using first occurrence)
    await expect(page.getByText('claude-3-5-sonnet-20241022').first()).toBeVisible();
  });

  test('status dot has correct color class for idle state', async ({ page }) => {
    const idleText = page.locator('text=Idle');
    await expect(idleText).toBeVisible();

    // Get the parent container and find the status dot
    const container = idleText.locator('xpath=..');
    const statusDot = container.locator('span').first();
    
    // Idle should have gray background and NO pulse animation
    await expect(statusDot).toHaveClass(/bg-gray-500/);
    await expect(statusDot).not.toHaveClass(/animate-pulse/);
  });
});
