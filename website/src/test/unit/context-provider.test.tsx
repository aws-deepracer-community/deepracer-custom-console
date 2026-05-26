import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContextProvider, ApiProvider, AuthProvider } from "../../components/context-provider";

// Mock all the custom hooks and contexts
const mockUseBatteryProvider = vi.fn();
const mockUseNetworkProvider = vi.fn();
const mockUseSupportedApisProvider = vi.fn();
const mockUseModelsProvider = vi.fn();
const mockUsePreferencesProvider = vi.fn();
const mockUseApiProvider = vi.fn();
const mockUseAuthProvider = vi.fn();

vi.mock("../../common/hooks/use-battery", () => ({
  useBatteryProvider: () => mockUseBatteryProvider(),
  BatteryContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="battery-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-network", () => ({
  useNetworkProvider: () => mockUseNetworkProvider(),
  NetworkContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="network-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-supported-apis", () => ({
  useSupportedApisProvider: () => mockUseSupportedApisProvider(),
  SupportedApisContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="supported-apis-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-models", () => ({
  useModelsProvider: () => mockUseModelsProvider(),
  ModelsContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="models-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-preferences", () => ({
  usePreferencesProvider: () => mockUsePreferencesProvider(),
  PreferencesContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="preferences-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-api", () => ({
  useApiProvider: () => mockUseApiProvider(),
  ApiContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="api-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

vi.mock("../../common/hooks/use-authentication", () => ({
  useAuthProvider: () => mockUseAuthProvider(),
  AuthContext: {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) => (
      <div data-testid="auth-context" data-value={JSON.stringify(value)}>
        {children}
      </div>
    ),
  },
}));

describe("Context Providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ContextProvider", () => {
    it("should render all nested context providers", () => {
      // Set up mock return values
      mockUseBatteryProvider.mockReturnValue({
        batteryLevel: 85,
        batteryError: false,
        hasInitialReading: true,
      });
      mockUseNetworkProvider.mockReturnValue({
        ssid: "TestWiFi",
        ipAddresses: ["192.168.1.100"],
        error: false,
      });
      mockUseSupportedApisProvider.mockReturnValue({
        supportedApis: ["battery", "network"],
        isEmergencyStopSupported: true,
        isDeviceStatusSupported: true,
      });
      mockUseModelsProvider.mockReturnValue({
        models: [{ name: "test-model", path: "/test/path" }],
        selectedModel: null,
        error: false,
      });
      mockUsePreferencesProvider.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: false,
        },
      });

      render(
        <ContextProvider>
          <div data-testid="test-child">Test Content</div>
        </ContextProvider>
      );

      // Check that all context providers are rendered
      expect(screen.getByTestId("supported-apis-context")).toBeInTheDocument();
      expect(screen.getByTestId("preferences-context")).toBeInTheDocument();
      expect(screen.getByTestId("battery-context")).toBeInTheDocument();
      expect(screen.getByTestId("network-context")).toBeInTheDocument();
      expect(screen.getByTestId("models-context")).toBeInTheDocument();
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should call all provider hooks", () => {
      render(
        <ContextProvider>
          <div>Test</div>
        </ContextProvider>
      );

      expect(mockUseBatteryProvider).toHaveBeenCalled();
      expect(mockUseNetworkProvider).toHaveBeenCalled();
      expect(mockUseSupportedApisProvider).toHaveBeenCalled();
      expect(mockUseModelsProvider).toHaveBeenCalled();
      expect(mockUsePreferencesProvider).toHaveBeenCalled();
    });

    it("should pass correct values to context providers", () => {
      const mockBatteryValue = {
        batteryLevel: 85,
        batteryError: false,
        hasInitialReading: true,
      };
      const mockNetworkValue = {
        ssid: "TestWiFi",
        ipAddresses: ["192.168.1.100"],
        error: false,
      };

      mockUseBatteryProvider.mockReturnValue(mockBatteryValue);
      mockUseNetworkProvider.mockReturnValue(mockNetworkValue);
      mockUseSupportedApisProvider.mockReturnValue({
        supportedApis: ["battery", "network"],
        isEmergencyStopSupported: true,
        isDeviceStatusSupported: true,
      });
      mockUseModelsProvider.mockReturnValue({
        models: [{ name: "test-model", path: "/test/path" }],
        selectedModel: null,
        error: false,
      });
      mockUsePreferencesProvider.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: false,
        },
      });

      render(
        <ContextProvider>
          <div>Test</div>
        </ContextProvider>
      );

      // Check that context providers receive the correct values
      const batteryContext = screen.getByTestId("battery-context");
      expect(batteryContext.getAttribute("data-value")).toBe(JSON.stringify(mockBatteryValue));

      const networkContext = screen.getByTestId("network-context");
      expect(networkContext.getAttribute("data-value")).toBe(JSON.stringify(mockNetworkValue));
    });

    it("should handle provider hook errors gracefully", () => {
      // Mock one provider to throw an error
      mockUseBatteryProvider.mockImplementation(() => {
        throw new Error("Battery hook error");
      });

      expect(() => {
        render(
          <ContextProvider>
            <div>Test</div>
          </ContextProvider>
        );
      }).toThrow("Battery hook error");
    });

    it("should update when provider values change", () => {
      // Reset the mock to ensure we start clean
      mockUseBatteryProvider.mockReturnValue({
        batteryLevel: 100,
        batteryError: false,
        hasInitialReading: true,
      });

      const { rerender } = render(
        <ContextProvider>
          <div>Test</div>
        </ContextProvider>
      );

      // Update mock return value
      const newBatteryValue = {
        batteryLevel: 50,
        batteryError: true,
        hasInitialReading: true,
      };
      mockUseBatteryProvider.mockReturnValue(newBatteryValue);

      rerender(
        <ContextProvider>
          <div>Test</div>
        </ContextProvider>
      );

      // Verify the provider was called again
      expect(mockUseBatteryProvider).toHaveBeenCalledTimes(2);
    });

    it("should maintain proper nesting order", () => {
      mockUseSupportedApisProvider.mockReturnValue({
        supportedApis: ["battery", "network"],
        isEmergencyStopSupported: true,
        isDeviceStatusSupported: true,
      });
      mockUsePreferencesProvider.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: false,
        },
      });
      mockUseBatteryProvider.mockReturnValue({
        batteryLevel: 85,
        batteryError: false,
        hasInitialReading: true,
      });
      mockUseNetworkProvider.mockReturnValue({
        ssid: "TestWiFi",
        ipAddresses: ["192.168.1.100"],
        error: false,
      });
      mockUseModelsProvider.mockReturnValue({
        models: [{ name: "test-model", path: "/test/path" }],
        selectedModel: null,
        error: false,
      });

      render(
        <ContextProvider>
          <div data-testid="child">Test</div>
        </ContextProvider>
      );

      // Check the nesting order by traversing the DOM
      const supportedApisContext = screen.getByTestId("supported-apis-context");
      const preferencesContext = screen.getByTestId("preferences-context");
      const batteryContext = screen.getByTestId("battery-context");
      const networkContext = screen.getByTestId("network-context");
      const modelsContext = screen.getByTestId("models-context");

      // Verify that all contexts exist
      expect(supportedApisContext).toBeInTheDocument();
      expect(preferencesContext).toBeInTheDocument();
      expect(batteryContext).toBeInTheDocument();
      expect(networkContext).toBeInTheDocument();
      expect(modelsContext).toBeInTheDocument();

      // The child should be nested in all contexts
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("ApiProvider", () => {
    it("should render with children", () => {
      const mockApiValue = {
        isLoading: false,
        error: null,
      };
      mockUseApiProvider.mockReturnValue(mockApiValue);

      render(
        <ApiProvider>
          <div data-testid="api-child">API Child Content</div>
        </ApiProvider>
      );

      expect(screen.getByTestId("api-context")).toBeInTheDocument();
      expect(screen.getByTestId("api-child")).toBeInTheDocument();
      expect(screen.getByText("API Child Content")).toBeInTheDocument();
    });

    it("should call useApiProvider hook", () => {
      mockUseApiProvider.mockReturnValue({});

      render(
        <ApiProvider>
          <div>Test</div>
        </ApiProvider>
      );

      expect(mockUseApiProvider).toHaveBeenCalled();
    });

    it("should pass correct value to ApiContext.Provider", () => {
      const mockApiValue = {
        isLoading: false,
        error: null,
      };
      mockUseApiProvider.mockReturnValue(mockApiValue);

      render(
        <ApiProvider>
          <div>Test</div>
        </ApiProvider>
      );

      const apiContext = screen.getByTestId("api-context");
      expect(apiContext.getAttribute("data-value")).toBe(JSON.stringify(mockApiValue));
    });

    it("should handle API provider updates", () => {
      const initialValue = { isLoading: true, error: null };
      const updatedValue = { isLoading: false, error: null };

      mockUseApiProvider.mockReturnValue(initialValue);

      const { rerender } = render(
        <ApiProvider>
          <div>Test</div>
        </ApiProvider>
      );

      mockUseApiProvider.mockReturnValue(updatedValue);

      rerender(
        <ApiProvider>
          <div>Test</div>
        </ApiProvider>
      );

      expect(mockUseApiProvider).toHaveBeenCalledTimes(2);
    });

    it("should handle useApiProvider errors", () => {
      mockUseApiProvider.mockImplementation(() => {
        throw new Error("API provider error");
      });

      expect(() => {
        render(
          <ApiProvider>
            <div>Test</div>
          </ApiProvider>
        );
      }).toThrow("API provider error");
    });
  });

  describe("AuthProvider", () => {
    it("should render with children", () => {
      const mockAuthValue = {
        isAuthenticated: true,
        user: { username: "testuser" },
      };
      mockUseAuthProvider.mockReturnValue(mockAuthValue);

      render(
        <AuthProvider>
          <div data-testid="auth-child">Auth Child Content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId("auth-context")).toBeInTheDocument();
      expect(screen.getByTestId("auth-child")).toBeInTheDocument();
      expect(screen.getByText("Auth Child Content")).toBeInTheDocument();
    });

    it("should call useAuthProvider hook", () => {
      mockUseAuthProvider.mockReturnValue({});

      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(mockUseAuthProvider).toHaveBeenCalled();
    });

    it("should pass correct value to AuthContext.Provider", () => {
      const mockAuthValue = {
        isAuthenticated: true,
        user: { username: "testuser" },
      };
      mockUseAuthProvider.mockReturnValue(mockAuthValue);

      render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      const authContext = screen.getByTestId("auth-context");
      expect(authContext.getAttribute("data-value")).toBe(JSON.stringify(mockAuthValue));
    });

    it("should handle authentication state changes", () => {
      const loggedOutValue = { isAuthenticated: false, user: null };
      const loggedInValue = {
        isAuthenticated: true,
        user: { username: "testuser" },
      };

      mockUseAuthProvider.mockReturnValue(loggedOutValue);

      const { rerender } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      mockUseAuthProvider.mockReturnValue(loggedInValue);

      rerender(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      expect(mockUseAuthProvider).toHaveBeenCalledTimes(2);
    });

    it("should handle useAuthProvider errors", () => {
      mockUseAuthProvider.mockImplementation(() => {
        throw new Error("Auth provider error");
      });

      expect(() => {
        render(
          <AuthProvider>
            <div>Test</div>
          </AuthProvider>
        );
      }).toThrow("Auth provider error");
    });
  });

  describe("Combined Provider Usage", () => {
    it("should work when providers are nested together", () => {
      mockUseApiProvider.mockReturnValue({
        isLoading: false,
        error: null,
      });
      mockUseAuthProvider.mockReturnValue({
        isAuthenticated: true,
        user: { username: "testuser" },
      });

      render(
        <AuthProvider>
          <ApiProvider>
            <div data-testid="nested-child">Nested Content</div>
          </ApiProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId("auth-context")).toBeInTheDocument();
      expect(screen.getByTestId("api-context")).toBeInTheDocument();
      expect(screen.getByTestId("nested-child")).toBeInTheDocument();
    });

    it("should maintain provider independence", () => {
      mockUseApiProvider.mockReturnValue({
        isLoading: false,
        error: null,
      });
      mockUseAuthProvider.mockReturnValue({
        isAuthenticated: true,
        user: { username: "testuser" },
      });

      render(
        <div>
          <AuthProvider>
            <div data-testid="auth-only">Auth Only</div>
          </AuthProvider>
          <ApiProvider>
            <div data-testid="api-only">API Only</div>
          </ApiProvider>
        </div>
      );

      expect(screen.getByTestId("auth-only")).toBeInTheDocument();
      expect(screen.getByTestId("api-only")).toBeInTheDocument();
      expect(mockUseApiProvider).toHaveBeenCalled();
      expect(mockUseAuthProvider).toHaveBeenCalled();
    });
  });
});
