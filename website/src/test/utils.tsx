import { ReactElement } from "react";
import { render as rtlRender } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { expect, vi } from "vitest";
import { BatteryContext } from "../common/hooks/use-battery";
import { NetworkContext } from "../common/hooks/use-network";
import { SupportedApisContext } from "../common/hooks/use-supported-apis";
import { ModelsContext } from "../common/hooks/use-models";
import { PreferencesContext } from "../common/hooks/use-preferences";
import { ApiContext } from "../common/hooks/use-api";
import { AuthContext } from "../common/hooks/use-authentication";
import { KeyValuePairsWrapper } from "@cloudscape-design/components/test-utils/dom";

// Re-export everything from testing library
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";

// Mock providers for testing
const mockApiProvider = {
  get: async <T,>(): Promise<T | null> => ({ success: true } as T),
  post: async <T,>(): Promise<T | null> => ({ success: true } as T),
};

const mockAuthProvider = {
  isAuthenticated: true,
  login: () => {},
  logout: () => {},
};

const mockBatteryProvider = {
  batteryLevel: 85,
  batteryError: false,
  hasInitialReading: true,
  batteryWarningDismissed: false,
  batteryErrorDismissed: false,
  setBatteryWarningDismissed: () => {},
  setBatteryErrorDismissed: () => {},
  batteryFlashbarItems: [],
};

const mockNetworkProvider = {
  ssid: "DeepRacer-WiFi",
  ipAddresses: ["192.168.1.100"],
  isLoading: false,
  isUSBConnected: true,
  hasError: false,
};

const mockSupportedApisProvider = {
  supportedApis: ["get_battery_level", "start_stop", "emergency_stop"],
  isEmergencyStopSupported: true,
  isDeviceStatusSupported: true,
  isTimeApiSupported: true,
  isLoading: false,
  hasError: false,
};

export const mockModelsProvider = {
  modelOptions: [
    {
      label: "my-racing-model",
      value: "my-racing-model",
      description: "A racing model",
      disabled: false,
    },
  ],
  selectedModel: {
    label: "my-racing-model",
    value: "my-racing-model",
    description: "A racing model",
    disabled: false,
  },
  isModelLoaded: true,
  isModelLoading: false,
  setSelectedModel: vi.fn(),
  loadModel: vi.fn().mockResolvedValue(true),
  reloadModels: vi.fn().mockResolvedValue(undefined),
  loadStatus: {
    loading: false,
    success: true,
    error: null,
  },
  modelFlashbarItems: [],
  clearModelFlashbar: vi.fn(),
  checkModelLoadStatus: vi.fn().mockResolvedValue(true),
};

const mockPreferencesProvider = {
  settings: {
    enableSpeedAdjustment: true,
    enableDeviceStatus: true,
  },
  setEnableSpeedAdjustment: () => {},
  setEnableDeviceStatus: () => {},
};

// Comprehensive render function with all providers
export const render = (ui: ReactElement) => {
  return rtlRender(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthProvider}>
        <ApiContext.Provider value={mockApiProvider}>
          <SupportedApisContext.Provider value={mockSupportedApisProvider}>
            <PreferencesContext.Provider value={mockPreferencesProvider}>
              <BatteryContext.Provider value={mockBatteryProvider}>
                <NetworkContext.Provider value={mockNetworkProvider}>
                  <ModelsContext.Provider value={mockModelsProvider}>{ui}</ModelsContext.Provider>
                </NetworkContext.Provider>
              </BatteryContext.Provider>
            </PreferencesContext.Provider>
          </SupportedApisContext.Provider>
        </ApiContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

// Flexible render function that allows custom preferences
export const renderWithCustomPreferences = (ui: ReactElement, customSettings: Partial<typeof mockPreferencesProvider.settings>) => {
  const customPreferencesProvider = {
    ...mockPreferencesProvider,
    settings: {
      ...mockPreferencesProvider.settings,
      ...customSettings,
    },
  };

  return rtlRender(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthProvider}>
        <ApiContext.Provider value={mockApiProvider}>
          <SupportedApisContext.Provider value={mockSupportedApisProvider}>
            <PreferencesContext.Provider value={customPreferencesProvider}>
              <BatteryContext.Provider value={mockBatteryProvider}>
                <NetworkContext.Provider value={mockNetworkProvider}>
                  <ModelsContext.Provider value={mockModelsProvider}>{ui}</ModelsContext.Provider>
                </NetworkContext.Provider>
              </BatteryContext.Provider>
            </PreferencesContext.Provider>
          </SupportedApisContext.Provider>
        </ApiContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

// Reusable helper function for testing key-value pairs
export const expectKeyValuePair = (
  kvPairsWrapper: KeyValuePairsWrapper,
  label: string,
  expectedValue: string
) => {
  const item = kvPairsWrapper
    .findItems()
    .find((item) => item.findLabel()?.getElement()?.textContent === label);
  expect(item, `Key-value pair with label "${label}" should exist`).toBeTruthy();
  expect(
    item?.findValue()?.getElement(),
    `Value for "${label}" should be accessible`
  ).toHaveTextContent(expectedValue);
};
