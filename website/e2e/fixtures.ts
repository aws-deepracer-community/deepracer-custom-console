import { test as base, expect } from '@playwright/test'

// Extend the base test to include common setup
export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock common API endpoints for all tests
    await page.route('**/redirect_login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'csrf-token-123'
      })
    })

    await page.route('**/api/get_device_info', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          battery_level: 85,
          is_charging: false
        })
      })
    })

    await page.route('**/api/get_car_state', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          car_state: 'stopped'
        })
      })
    })

    await page.route('**/api/models', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          models: []
        })
      })
    })

    await page.route('**/api/get_network_info', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          ssid: 'TestNetwork',
          ip_addresses: ['192.168.1.100']
        })
      })
    })

    // Handle ENETUNREACH errors by mocking the problematic endpoints
    await page.route('**/login', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: 'success'
        })
      } else {
        await route.continue()
      }
    })

    await use(page)
  }
})

export { expect }
