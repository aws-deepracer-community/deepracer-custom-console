import { authTest as test, expect } from "./fixtures";

test.describe("DeepRacer Console Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/");

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);

    // Should show login form with correct elements
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /access vehicle/i })).toBeVisible();
    await expect(page.getByText("Unlock your AWS DeepRacer vehicle")).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    let loginCalled = false;
    page.on("request", (request) => {
      if (request.url().includes("/login") && request.method() === "POST") {
        loginCalled = true;
      }
    });

    await page.goto("/");

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await page.waitForLoadState("networkidle");

    // Fill in the password field
    await page.locator('input[type="password"]').fill("testpassword");
    await page.getByRole("button", { name: /access vehicle/i }).click();

    // Wait for the page to fully load
    await page.waitForURL(/.*home/, { timeout: 1000 });
    await page.waitForLoadState("networkidle");

    // Should show main heading and navigation specific to authenticated users
    await expect(page.locator("main")).toBeVisible({ timeout: 1000 });
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 1000 });

    // Look for the Autonomous Mode tab as proof the home page loaded correctly
    await expect(page.getByRole("tab", { name: /autonomous mode/i })).toBeVisible({
      timeout: 1000,
    });
    await expect(page.getByRole("tab", { name: /manual mode/i })).toBeVisible({ timeout: 1000 });

    // Assert that login was called
    expect(loginCalled).toBe(true);
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    await page.goto("/");

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/);

    // Mock failed login response
    await page.route("/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: "failure",
      });
    });

    // Fill in wrong password
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /access vehicle/i }).click();

    // Should show error message
    await expect(page.getByText(/Login failed - invalid credentials/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });
});
