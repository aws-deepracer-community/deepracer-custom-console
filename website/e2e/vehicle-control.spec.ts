import { test, expect } from "./fixtures";

test.describe("DeepRacer Vehicle Control", () => {
  test("should display vehicle control interface", async ({ page }) => {
    await page.goto("/home");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if the main content area is visible
    await expect(page.getByRole("heading", { name: "Control Vehicle", level: 1 })).toBeVisible();
    // Check that the "Autonomous Mode" tab is active (has aria-selected="true")
    await expect(page.getByRole("tab", { name: "Autonomous Mode" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // Look for start/stop buttons (may be disabled initially)
    const startButton = page.getByRole("button", { name: /start vehicle/i });
    const stopButton = page.getByRole("button", { name: /stop vehicle/i });

    // Both of these should be visible (even if disabled)
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled();
    await expect(stopButton).toBeVisible();
    await expect(stopButton).toBeDisabled();

    // Should show the main control interface loaded
    await expect(page.locator('main, [role="main"], .main-content').first()).toBeVisible();
  });

  test("should enable loading of a model", async ({ page }) => {
    // Mock models API
    let requestStatus = "error";

    await page.route("**/api/isModelLoading", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          isModelLoading: requestStatus,
        }),
      });
    });

    await page.goto("/home");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Click on the "Select a reinforcement model" button
    const selectModelButton = page.getByRole("button", { name: /Select a reinforcement model/i });
    await expect(selectModelButton).toBeVisible();
    await selectModelButton.click();
    await expect(selectModelButton).toHaveAttribute("aria-expanded", "true");

    // Wait for the listbox to appear and select the first option
    const listbox = page.getByRole("listbox", { name: /Select a reinforcement model/i });
    await expect(listbox).toBeVisible();

    // Click the first model option
    const firstOption = page.getByRole("option", { name: /Sample_single_cam/i });
    await expect(firstOption).toBeVisible();
    await firstOption.click();

    // Wait for the model loading dialog to appear
    const modelDialog = page.getByRole("dialog", { name: /load model/i });
    await expect(modelDialog).toBeVisible();
    requestStatus = "loading";
    // Check if the dialog has the expected elements
    await expect(modelDialog.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(modelDialog.getByRole("button", { name: /load/i })).toBeVisible();
    await modelDialog.getByRole("button", { name: /load/i }).click();

    await expect(modelDialog).not.toBeVisible();
    requestStatus = "loaded";

    // Look for green banner - success notification
    const successRegion = page.getByRole("region");
    const successList = successRegion.getByRole("list");
    const successListItem = successList.getByRole("listitem");
    const successGroup = successListItem.getByRole("group", { name: /Model loaded successfully/i });
    await expect(successGroup).toBeVisible();

    // Look for start/stop buttons (may be disabled initially)
    await expect(page.getByRole("button", { name: /start vehicle/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /stop vehicle/i })).toBeDisabled();
  });
});
