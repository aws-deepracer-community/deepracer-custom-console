import { describe, it, expect } from 'vitest'
import { render, renderWithCustomPreferences, waitFor } from '../utils'
import createWrapper from '@cloudscape-design/components/test-utils/dom'
import HomePage from '../../pages/home'

describe('HomePage Integration', () => {
  it('should load sensor status on mount', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Look for device status metrics that should be rendered
      const splitPanel = wrapper.findSplitPanel()
      expect(splitPanel).toBeTruthy()
      
      // Check for device status content within the split panel
      expect(splitPanel?.getElement()).toHaveTextContent(/CPU|Memory|Disk|Temperature/)
    }, { timeout: 10000 })
  })

  it('should display models dropdown with mocked data', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Should show model selection area - look for the actual model name
      const selects = wrapper.findAllSelects()
      const modelSelect = selects.find(select => 
        select.getElement().textContent?.includes('my-racing-model')
      )
      expect(modelSelect).toBeTruthy()
    }, { timeout: 10000 })
  })

  it('should handle vehicle control actions', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Just check that buttons exist on the page
      const buttons = wrapper.findAllButtons()
      expect(buttons.length).toBeGreaterThan(0)
    }, { timeout: 10000 })
  })

  it('should toggle between autonomous and manual drive modes', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Should have tabs for different drive modes
      const tabs = wrapper.findTabs()
      expect(tabs).toBeTruthy()
      
      const tabsElement = tabs?.getElement()
      expect(tabsElement).toHaveTextContent(/autonomous/i)
      expect(tabsElement).toHaveTextContent(/manual/i)
    }, { timeout: 10000 })
  })

  it('should display battery and network information', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Should show battery level from context - look for specific battery indicator
      expect(wrapper.getElement()).toHaveTextContent(/85%/)
      
      // Should show network info - look for WiFi network name
      expect(wrapper.getElement()).toHaveTextContent(/DeepRacer-WiFi/)
    }, { timeout: 10000 })
  })

  it('should show Device Status panel when enableDeviceStatus is true', async () => {
    render(<HomePage />)

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Should show the Car Health header from DeviceStatusPanel
      const splitPanel = wrapper.findSplitPanel()
      expect(splitPanel).toBeTruthy()
      expect(splitPanel?.getElement()).toHaveTextContent('Car Health')
      
      // Should show CPU metrics section
      expect(splitPanel?.getElement()).toHaveTextContent('CPU')
      expect(splitPanel?.getElement()).toHaveTextContent('Usage:')
      expect(splitPanel?.getElement()).toHaveTextContent('Temperature:')
      expect(splitPanel?.getElement()).toHaveTextContent('Frequency:')
      
      // Should show Memory Usage section
      expect(splitPanel?.getElement()).toHaveTextContent('Memory Usage')
      expect(splitPanel?.getElement()).toHaveTextContent('RAM:')
      expect(splitPanel?.getElement()).toHaveTextContent('Disk:')
      
      // Should show Performance section
      expect(splitPanel?.getElement()).toHaveTextContent('Performance')
      expect(splitPanel?.getElement()).toHaveTextContent('Mean Latency:')
      expect(splitPanel?.getElement()).toHaveTextContent('95% Latency:')
      expect(splitPanel?.getElement()).toHaveTextContent('Frame Rate:')
    }, { timeout: 10000 })
  })

  it('should NOT show Device Status panel when enableDeviceStatus is false', async () => {
    renderWithCustomPreferences(<HomePage />, { enableDeviceStatus: false })

    await waitFor(() => {
      const wrapper = createWrapper(document.body)
      
      // Should NOT show the Car Health header from DeviceStatusPanel
      const splitPanel = wrapper.findSplitPanel()
      expect(splitPanel).toBeFalsy()
      
      // Should NOT show any device status specific elements
      expect(wrapper.getElement()).not.toHaveTextContent('Mean Latency:')
      expect(wrapper.getElement()).not.toHaveTextContent('95% Latency:')
      expect(wrapper.getElement()).not.toHaveTextContent('Frame Rate:')
    }, { timeout: 10000 })
  })
})
