import { test, expect } from './fixtures'

test.describe('DeepRacer Vehicle Control', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      document.cookie = 'deepracer_token=test-token; path=/'
    })
    
    // Mock all API endpoints
    await page.route('/api/**', async route => {
      const url = route.request().url()
      
      if (url.includes('/api/get_battery_level')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, battery_level: 85 })
        })
      } else if (url.includes('/api/get_sensor_status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            camera_status: 'connected',
            stereo_status: 'connected',
            lidar_status: 'disconnected'
          })
        })
      } else if (url.includes('/api/models')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            models: [
              {
                model_folder_name: 'my-racing-model',
                model_sensors: ['camera'],
                is_select_disabled: false
              }
            ]
          })
        })
      } else if (url.includes('/api/start_stop')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else {
        // Default response for other API calls
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })
  })

  test('should display vehicle control interface', async ({ page }) => {
    await page.goto('/home')
    
    // Should show vehicle controls
    await expect(page.getByText('Control Vehicle').first()).toBeVisible()
    
    // Look for start/stop buttons (may be disabled initially)
    const startButton = page.getByRole('button', { name: /start/i })
    const stopButton = page.getByRole('button', { name: /stop/i })
    
    // At least one of these should be visible (even if disabled)
    await expect(startButton.or(stopButton).first()).toBeVisible()
    
    // Should show the main control interface loaded
    await expect(page.locator('main, [role="main"], .main-content').first()).toBeVisible()
  })

  test('should load vehicle control page correctly', async ({ page }) => {
    await page.goto('/home')
    
    // Mock API responses for better test reliability
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    // Verify basic page structure
    await expect(page.getByText('Control Vehicle').first()).toBeVisible()
    
    // The page should load without major errors
    await page.waitForLoadState('networkidle')
  })

  test('should show control interface elements', async ({ page }) => {
    await page.goto('/home')
    
    // Check that the main control areas exist
    await expect(page.getByText('Control Vehicle').first()).toBeVisible()
    
    // Look for control tabs (autonomous/manual mode switching)
    const tabElements = page.locator('role=tab, [role="tab"], .tab, .mode-tab')
    const controlElements = page.locator('button, .button, [role="button"]')
    
    // At least some control elements should be present
    await expect(tabElements.or(controlElements).first()).toBeVisible()
  })

  test('should display basic UI structure', async ({ page }) => {
    await page.goto('/home')
    
    // Basic page structure should be present
    await expect(page.getByText('Control Vehicle').first()).toBeVisible()
    
    // Navigation should work
    await expect(page.locator('nav, .navigation, [role="navigation"]').first()).toBeVisible()
  })
})
