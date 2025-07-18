import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils'
import NavigationPanel from '../../components/navigation-panel'

// Mock the hooks and dependencies
vi.mock('../../common/hooks/use-navigation-panel-state', () => ({
  useNavigationPanelState: () => [false, vi.fn()],
}))

vi.mock('../../common/hooks/use-on-follow', () => ({
  useOnFollow: () => vi.fn(),
}))

vi.mock('../../common/hooks/use-battery', () => ({
  useBattery: () => ({
    batteryLevel: 85,
    batteryError: false,
    hasInitialReading: true,
  }),
  BatteryContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { batteryLevel: number; batteryError: boolean; hasInitialReading: boolean }) => React.ReactNode }) => children({
      batteryLevel: 85,
      batteryError: false,
      hasInitialReading: true,
    }),
  },
}))

vi.mock('../../common/hooks/use-authentication', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'test-user' },
  }),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { isAuthenticated: boolean; user: { username: string } }) => React.ReactNode }) => children({
      isAuthenticated: true,
      user: { username: 'test-user' },
    }),
  },
}))

vi.mock('../../common/hooks/use-api', () => ({
  useApi: () => ({
    request: vi.fn(),
  }),
  ApiContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { request: () => void }) => React.ReactNode }) => children({
      request: vi.fn(),
    }),
  },
}))

vi.mock('../../common/hooks/use-models', () => ({
  useModels: () => ({
    models: [{ name: 'test-model' }],
  }),
  ModelsContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { models: { name: string }[] }) => React.ReactNode }) => children({
      models: [{ name: 'test-model' }],
    }),
  },
}))

vi.mock('../../common/hooks/use-preferences', () => ({
  usePreferences: () => ({
    preferences: {},
  }),
  PreferencesContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { preferences: object }) => React.ReactNode }) => children({
      preferences: {},
    }),
  },
}))

vi.mock('../../common/hooks/use-network', () => ({
  useNetwork: () => ({
    ssid: 'TestWiFi',
    ipAddresses: ['192.168.1.100'],
  }),
  NetworkContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { ssid: string; ipAddresses: string[] }) => React.ReactNode }) => children({
      ssid: 'TestWiFi',
      ipAddresses: ['192.168.1.100'],
    }),
  },
}))

vi.mock('../../common/hooks/use-supported-apis', () => ({
  useSupportedApis: () => ({
    isEmergencyStopSupported: true,
  }),
  SupportedApisContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { isEmergencyStopSupported: boolean }) => React.ReactNode }) => children({
      isEmergencyStopSupported: true,
    }),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/home' }),
  }
})

describe('NavigationPanel', () => {
  const mockBatteryProps = {
    battery: {
      level: 85,
      error: false,
      hasInitialReading: true,
    },
  }

  it('should render navigation items', () => {
    render(<NavigationPanel {...mockBatteryProps} />)
    
    expect(screen.getByText('Control Vehicle')).toBeInTheDocument()
    expect(screen.getByText('Models')).toBeInTheDocument()
    expect(screen.getByText('Calibration')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  it('should display battery level', () => {
    render(<NavigationPanel {...mockBatteryProps} />)
    
    // Check that battery-related text is present
    expect(screen.getByText('Battery Status')).toBeInTheDocument()
    expect(screen.getByText('Current Battery Charge')).toBeInTheDocument()
    
    // Check that at least one instance of the battery percentage exists
    const batteryElements = screen.getAllByText('85%')
    expect(batteryElements.length).toBeGreaterThan(0)
  })

  it('should display network information', () => {
    render(<NavigationPanel {...mockBatteryProps} />)
    
    expect(screen.getByText('TestWiFi')).toBeInTheDocument()
    expect(screen.getByText('192.168.1.100')).toBeInTheDocument()
  })

  it('should show emergency stop button when supported', () => {
    render(<NavigationPanel {...mockBatteryProps} />)
    
    expect(screen.getByText('Emergency Stop & Reset')).toBeInTheDocument()
    // Alternatively, you can use data-testid:
    // expect(screen.getByTestId('emergency-stop')).toBeInTheDocument()
  })

  it('should handle battery error state', () => {
    const errorBatteryProps = {
      battery: {
        level: -1,
        error: true,
        hasInitialReading: true,
      },
    }

    render(<NavigationPanel {...errorBatteryProps} />)
    
    // Should show error indicator instead of percentage
    expect(screen.queryByText('-1%')).not.toBeInTheDocument()
  })
})
