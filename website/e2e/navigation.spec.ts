import { test, expect } from "./fixtures";

test.describe("DeepRacer Navigation", () => {
  test("should navigate between different pages", async ({ page }) => {
    await page.goto("/home");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if the main content area is visible
    await expect(page.getByRole("heading", { name: "Control Vehicle", level: 1 })).toBeVisible();

    // Check if navigation items are already visible, if not try to expand navigation
    const modelsLink = page.getByRole("navigation").getByRole("link", { name: "Models" });
    const isModelsVisible = await modelsLink.isVisible();

    if (!isModelsVisible) {
      // Use the exact structure from error-context.md: main > navigation > button
      const navToggleButton = page.getByRole("navigation").getByRole("button").first();
      await navToggleButton.click();
      await page.waitForTimeout(500); // Wait for navigation to expand
    }

    // Navigate to Models page
    await expect(modelsLink).toBeVisible();
    await modelsLink.click();
    await expect(page).toHaveURL(/.*models/);
    await expect(page.getByRole("heading", { name: "Models", level: 1 })).toBeVisible({
      timeout: 5000,
    });

    // Navigate to Calibration page
    await page.getByText("Calibration").click();
    await expect(page).toHaveURL(/.*calibration/);
    await expect(page.getByRole("heading", { name: "Calibration", level: 1 })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("heading", { name: "Steering", level: 2 })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole("heading", { name: "Speed", level: 2 })).toBeVisible({
      timeout: 5000,
    });

    // Navigate to Settings page
    await page.getByText("Settings").click();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByText("Network Settings")).toBeVisible();

    // Navigate to Logs page
    await page.getByText("Logs").click();
    await expect(page).toHaveURL(/.*logs/);
    // Just check URL for logs since logs page might be minimal

    // Navigate back to home
    await page.getByRole("navigation").getByRole("link", { name: "Control Vehicle" }).click();
    await expect(page).toHaveURL(/.*home/);
    await expect(page.getByRole("heading", { name: "Control Vehicle", level: 1 })).toBeVisible();
  });

  test("should display consistent navigation panel", async ({ page }) => {
    await page.goto("/home");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify the main content area loads
    await expect(page.getByRole("heading", { name: "Control Vehicle", level: 1 })).toBeVisible();

    // Check if navigation items are already visible, if not try to expand navigation
    const modelsLink = page.getByRole("navigation").getByRole("link", { name: "Models" });
    const isModelsVisible = await modelsLink.isVisible();

    if (!isModelsVisible) {
      // Use the exact structure from error-context.md: main > navigation > button
      const navToggleButton = page.getByRole("navigation").getByRole("button").first();
      await navToggleButton.click();
      await page.waitForTimeout(500); // Wait for navigation to expand
    }

    // Navigation panel should be visible on all pages
    const navigationItems = ["Control Vehicle", "Models", "Calibration", "Settings", "Logs"];

    for (const item of navigationItems) {
      // Use first() to avoid ambiguity with multiple elements
      await expect(page.getByRole("navigation").getByRole("link", { name: item })).toBeVisible();
    }
  });

  test("should handle emergency stop from any page", async ({ page }) => {
    await page.goto("/#/models");

    // Check that basic navigation works
    await expect(page.getByRole("heading", { name: "Models", level: 1 })).toBeVisible();

    // Check if navigation items are already visible, if not try to expand navigation
    const stopButton = page
      .getByRole("navigation")
      .getByRole("button", { name: "Emergency Stop & Reset" });
    const isStopButtonVisible = await stopButton.isVisible();

    if (!isStopButtonVisible) {
      // Use the exact structure from error-context.md: main > navigation > button
      const navToggleButton = page.getByRole("navigation").getByRole("button").first();
      await navToggleButton.click();
      await page.waitForTimeout(500); // Wait for navigation to expand
    }
    // Click the emergency stop button
    await expect(stopButton).toBeVisible();
    await stopButton.click();
  });

  test("should verify logout functionality exists", async ({ page }) => {
    await page.goto("/");

    // Check that basic navigation works
    await expect(page.getByRole("heading", { name: "Control Vehicle", level: 1 })).toBeVisible();

    // Check if navigation items are already visible, if not try to expand navigation
    const logoutButton = page.getByRole("navigation").getByRole("button", { name: "Logout" });
    const isLogoutButtonVisible = await logoutButton.isVisible();

    if (!isLogoutButtonVisible) {
      // Use the exact structure from error-context.md: main > navigation > button
      const navToggleButton = page.getByRole("navigation").getByRole("button").first();
      await navToggleButton.click();
      await page.waitForTimeout(500); // Wait for navigation to expand
    }
    // Click the logout button
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await page.waitForTimeout(500); // Wait for navigation to expand
    // Should go to login page
    await expect(page).toHaveURL(/.*log.*/);
  });
});
