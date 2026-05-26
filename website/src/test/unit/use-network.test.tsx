import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNetwork, useNetworkProvider, NetworkContext } from "../../common/hooks/use-network";
import { ReactNode } from "react";

// Create mock functions that we can control
const mockAuthData = {
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const mockApiData = {
  get: vi.fn(),
  post: vi.fn(),
};

// Mock the authentication hook
vi.mock("../../common/hooks/use-authentication", () => ({
  useAuth: () => mockAuthData,
}));

// Mock the API hook
vi.mock("../../common/hooks/use-api", () => ({
  useApi: () => mockApiData,
}));

// (Removed commented-out code for mocking timer functions)

// Types
interface NetworkState {
  ssid: string;
  ipAddresses: string[];
  isLoading: boolean;
  isUSBConnected: boolean;
  hasError: boolean;
}

// Test wrapper component for NetworkContext
const createWrapper = (networkValue: NetworkState) => {
  return ({ children }: { children: ReactNode }) => (
    <NetworkContext.Provider value={networkValue}>{children}</NetworkContext.Provider>
  );
};

describe("useNetwork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data to defaults
    mockAuthData.isAuthenticated = true;
    mockApiData.get.mockReset();
    mockApiData.post.mockReset();
    mockAuthData.login.mockReset();
    mockAuthData.logout.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw error when used outside of NetworkProvider", () => {
    // Expect the hook to throw an error when used outside of NetworkProvider
    expect(() => {
      renderHook(() => useNetwork());
    }).toThrow("useNetwork must be used within a NetworkProvider");
  });

  it("should return context value when used within NetworkProvider", () => {
    const mockNetworkState = {
      ssid: "TestNetwork",
      ipAddresses: ["192.168.1.100"],
      isLoading: false,
      isUSBConnected: true,
      hasError: false,
    };

    const wrapper = createWrapper(mockNetworkState);
    const { result } = renderHook(() => useNetwork(), { wrapper });

    expect(result.current).toBe(mockNetworkState);
    expect(result.current.ssid).toBe("TestNetwork");
    expect(result.current.ipAddresses).toEqual(["192.168.1.100"]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isUSBConnected).toBe(true);
    expect(result.current.hasError).toBe(false);
  });
});

describe("useNetworkProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use real timers to avoid complications
    vi.useRealTimers();
    
    // Reset mock data to defaults
    mockAuthData.isAuthenticated = true;
    mockApiData.get.mockReset();
    mockApiData.post.mockReset();
    mockAuthData.login.mockReset();
    mockAuthData.logout.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when not authenticated", () => {
    it("should reset network state and not fetch data", () => {
      // Set authentication to false for this test
      mockAuthData.isAuthenticated = false;

      const { result } = renderHook(() => useNetworkProvider());

      expect(result.current.ssid).toBe("");
      expect(result.current.ipAddresses).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.isUSBConnected).toBe(false);
      expect(mockApiData.get).not.toHaveBeenCalled();
    });
  });

  describe("when authenticated", () => {
    it("should fetch network status successfully", async () => {
      const mockResponse = {
        success: true,
        SSID: "MyWiFiNetwork",
        ip_address: "192.168.1.100, 10.0.0.1",
        is_usb_connected: true,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useNetworkProvider());

      // Wait for the API call to be made and state to update
      await waitFor(
        () => {
          expect(result.current.ssid).toBe("MyWiFiNetwork");
        },
        { timeout: 2000 }
      );

      // Check final state
      expect(result.current.ipAddresses).toEqual(["192.168.1.100", "10.0.0.1"]);
      expect(result.current.isUSBConnected).toBe(true);
      expect(result.current.hasError).toBe(false);
      expect(mockApiData.get).toHaveBeenCalledWith("get_network_details");
    });

    it("should handle API response with single IP address", async () => {
      const mockResponse = {
        success: true,
        SSID: "SingleIPNetwork",
        ip_address: "192.168.1.100",
        is_usb_connected: false,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useNetworkProvider());

      await waitFor(
        () => {
          expect(result.current.ssid).toBe("SingleIPNetwork");
        },
        { timeout: 2000 }
      );

      expect(result.current.ipAddresses).toEqual(["192.168.1.100"]);
      expect(result.current.isUSBConnected).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it("should handle API response with IP addresses containing spaces", async () => {
      const mockResponse = {
        success: true,
        SSID: "SpacedIPNetwork",
        ip_address: " 192.168.1.100 ,  10.0.0.1 , 172.16.0.1 ",
        is_usb_connected: true,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useNetworkProvider());

      await waitFor(() => {
        expect(result.current.ssid).toBe("SpacedIPNetwork");
      });

      expect(result.current.ipAddresses).toEqual(["192.168.1.100", "10.0.0.1", "172.16.0.1"]);
    });

    it("should handle unsuccessful API response", async () => {
      const mockResponse = {
        success: false,
        SSID: "",
        ip_address: "",
        is_usb_connected: false,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useNetworkProvider());

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      expect(result.current.ssid).toBe("");
      expect(result.current.ipAddresses).toEqual([]);
      expect(result.current.isUSBConnected).toBe(false);
    });

    it("should handle null API response", async () => {
      mockApiData.get.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useNetworkProvider());

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      expect(result.current.ssid).toBe("");
      expect(result.current.ipAddresses).toEqual([]);
      expect(result.current.isUSBConnected).toBe(false);
    });

    it("should handle API error", async () => {
      const mockError = new Error("Network request failed");
      mockApiData.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useNetworkProvider());

      await waitFor(() => {
        expect(result.current.hasError).toBe(true);
      });

      expect(result.current.ssid).toBe("");
      expect(result.current.ipAddresses).toEqual([]);
      expect(result.current.isUSBConnected).toBe(false);
    });

    it("should set up polling interval", async () => {
      const mockResponse = {
        success: true,
        SSID: "PollingNetwork",
        ip_address: "192.168.1.100",
        is_usb_connected: false,
      };

      mockApiData.get.mockResolvedValue(mockResponse);
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      renderHook(() => useNetworkProvider());

      await waitFor(() => {
        expect(mockApiData.get).toHaveBeenCalledTimes(1);
      });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 55000);
    });

    it("should cleanup interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useNetworkProvider());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("should handle authentication status change", () => {
      const { result, rerender } = renderHook(() => useNetworkProvider());

      // Initially authenticated, should call API
      expect(mockApiData.get).toHaveBeenCalled();

      // Change to not authenticated
      mockAuthData.isAuthenticated = false;
      rerender();

      expect(result.current.ssid).toBe("");
      expect(result.current.ipAddresses).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.isUSBConnected).toBe(false);
    });
  });
});
