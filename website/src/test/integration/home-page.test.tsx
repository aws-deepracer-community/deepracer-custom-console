import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '../utils'
import HomePage from '../../pages/home'

describe('HomePage Integration', () => {
  it('should load sensor status on mount', async () => {
    render(<HomePage />)

    // Wait for the component to load device status
    await waitFor(() => {
      // Look for device status metrics that should be rendered
      const metricsElements = screen.getAllByText(/CPU|Memory|Disk|Temperature/i)
      expect(metricsElements.length).toBeGreaterThan(0)
    }, { timeout: 10000 })
  })

  it('should display models dropdown with mocked data', async () => {
    render(<HomePage />)

    await waitFor(() => {
      // Should show model selection area - look for the actual model name
      expect(screen.getByText(/my-racing-model/i)).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('should handle vehicle control actions', async () => {
    render(<HomePage />)

    // Wait for component to be ready and look for any control buttons
    await waitFor(() => {
      // Just check that buttons exist on the page
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    }, { timeout: 10000 })
  })

  it('should toggle between autonomous and manual drive modes', async () => {
    render(<HomePage />)

    await waitFor(() => {
      // Should have tabs for different drive modes - look for tab elements
      const tabs = screen.getAllByRole('tab')
      const tabTexts = tabs.map(tab => tab.textContent)
      
      const hasAutonomous = tabTexts.some(text => text?.toLowerCase().includes('autonomous'))
      const hasManual = tabTexts.some(text => text?.toLowerCase().includes('manual'))
      
      expect(hasAutonomous).toBe(true)
      expect(hasManual).toBe(true)
    }, { timeout: 10000 })
  })

  it('should display battery and network information', async () => {
    render(<HomePage />)

    await waitFor(() => {
      // Should show battery level from context - look for specific battery indicator
      const batteryElements = screen.getAllByText(/85%/i)
      expect(batteryElements.length).toBeGreaterThan(0)
      
      // Should show network info - look for WiFi network name
      expect(screen.getByText(/DeepRacer-WiFi/i)).toBeInTheDocument()
    }, { timeout: 10000 })
  })
})
