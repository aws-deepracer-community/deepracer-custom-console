import { test, expect } from './fixtures'

test.describe('DeepRacer Console Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/home')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login/)
    
    // Should show login form with correct elements
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /access vehicle/i })).toBeVisible()
    await expect(page.getByText('Unlock your AWS DeepRacer vehicle')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Mock the CSRF token endpoint
    await page.route('/redirect_login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'csrf-token-123'
      })
    })
    
    // Fill in the password field
    await page.locator('input[type="password"]').fill('testpassword')
    
    // Mock successful login response
    await page.route('/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'success'
      })
    })
    
    // Submit login form
    await page.getByRole('button', { name: /access vehicle/i }).click()
    
    // Should redirect to home page after successful login
    await expect(page).toHaveURL(/.*home/)
    
    // Should show main navigation
    await expect(page.getByText('Control Vehicle').first()).toBeVisible()
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Mock the CSRF token endpoint
    await page.route('/redirect_login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'csrf-token-123'
      })
    })
    
    // Mock failed login response
    await page.route('/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'failure'
      })
    })
    
    // Fill in wrong password
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /access vehicle/i }).click()
    
    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/)
  })
})
