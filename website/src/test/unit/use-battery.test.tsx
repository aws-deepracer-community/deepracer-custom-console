import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBattery, useBatteryProvider, BatteryContext } from "../../common/hooks/use-battery";
import { FlashbarProps } from "@cloudscape-design/components";
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

// Types
interface BatteryState {
  batteryLevel: number;
  batteryError: boolean;
  hasInitialReading: boolean;
  batteryWarningDismissed: boolean;
  batteryErrorDismissed: boolean;
  batteryFlashbarItems: FlashbarProps.MessageDefinition[];
}

// Test wrapper component for BatteryContext
const createWrapper = (batteryValue: BatteryState) => {
  return ({ children }: { children: ReactNode }) => (
    <BatteryContext.Provider value={batteryValue}>{children}</BatteryContext.Provider>
  );
};

describe("useBattery", () => {
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

  it("should throw error when used outside of BatteryProvider", () => {
    // Expect the hook to throw an error when used outside of BatteryProvider
    expect(() => {
      renderHook(() => useBattery());
    }).toThrow("useBattery must be used within a BatteryProvider");
  });

  it("should return context value when used within BatteryProvider", () => {
    const mockBatteryState = {
      batteryLevel: 85,
      batteryError: false,
      hasInitialReading: true,
      batteryWarningDismissed: false,
      batteryErrorDismissed: false,
      batteryFlashbarItems: [],
    };

    const wrapper = createWrapper(mockBatteryState);
    const { result } = renderHook(() => useBattery(), { wrapper });

    expect(result.current).toBe(mockBatteryState);
    expect(result.current.batteryLevel).toBe(85);
    expect(result.current.batteryError).toBe(false);
    expect(result.current.hasInitialReading).toBe(true);
    expect(result.current.batteryWarningDismissed).toBe(false);
    expect(result.current.batteryErrorDismissed).toBe(false);
    expect(result.current.batteryFlashbarItems).toEqual([]);
  });
});

describe("useBatteryProvider", () => {
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

    // Mock window.location.hash
    Object.defineProperty(window, "location", {
      value: {
        hash: "#/home",
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when not authenticated", () => {
    it("should not fetch battery data", () => {
      // Set authentication to false for this test
      mockAuthData.isAuthenticated = false;

      const { result } = renderHook(() => useBatteryProvider());

      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(false);
      expect(result.current.batteryFlashbarItems).toEqual([]);
      expect(mockApiData.get).not.toHaveBeenCalled();
    });
  });

  describe("when on system-unavailable page", () => {
    it("should not fetch battery data", () => {
      // Mock window.location.hash to include system-unavailable
      Object.defineProperty(window, "location", {
        value: {
          hash: "#/system-unavailable",
        },
        writable: true,
      });

      const { result } = renderHook(() => useBatteryProvider());

      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(false);
      expect(result.current.batteryFlashbarItems).toEqual([]);
      expect(mockApiData.get).not.toHaveBeenCalled();
    });
  });

  describe("when authenticated", () => {
    it("should fetch battery status successfully", async () => {
      const mockResponse = {
        success: true,
        battery_level: 8, // 80%
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBatteryProvider());

      // Wait for the API call to be made and state to update
      await waitFor(
        () => {
          expect(result.current.batteryLevel).toBe(80);
        },
        { timeout: 2000 }
      );

      // Check final state
      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(true);
      expect(result.current.batteryFlashbarItems).toEqual([]);
      expect(mockApiData.get).toHaveBeenCalledWith("get_battery_level");
    });

    it("should handle battery disconnected (level -1)", async () => {
      const mockResponse = {
        success: true,
        battery_level: -1,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBatteryProvider());

      await waitFor(
        () => {
          expect(result.current.batteryError).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.hasInitialReading).toBe(true);
      // Should have error flashbar item
      expect(result.current.batteryFlashbarItems).toHaveLength(1);
      expect(result.current.batteryFlashbarItems[0].type).toBe("error");
      expect(result.current.batteryFlashbarItems[0].content).toBe(
        "Vehicle battery is not connected"
      );
    });

    it("should handle low battery warning (level <= 40%)", async () => {
      const mockResponse = {
        success: true,
        battery_level: 3, // 30%
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBatteryProvider());

      await waitFor(
        () => {
          expect(result.current.batteryLevel).toBe(30);
        },
        { timeout: 2000 }
      );

      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(true);
      // Should have warning flashbar item
      expect(result.current.batteryFlashbarItems).toHaveLength(1);
      expect(result.current.batteryFlashbarItems[0].type).toBe("warning");
      expect(result.current.batteryFlashbarItems[0].content).toBe("Battery Level is at 30%");
    });

    it("should handle unsuccessful API response", async () => {
      const mockResponse = {
        success: false,
        battery_level: 0,
      };

      mockApiData.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useBatteryProvider());

      // Wait for the API call
      await waitFor(() => {
        expect(mockApiData.get).toHaveBeenCalledWith("get_battery_level");
      });

      // State should remain at defaults since success is false
      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(false);
    });

    it("should handle API error", async () => {
      const mockError = new Error("Battery request failed");
      mockApiData.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useBatteryProvider());

      await waitFor(() => {
        expect(result.current.batteryError).toBe(true);
      });

      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.hasInitialReading).toBe(false);
      // Should have error flashbar item
      expect(result.current.batteryFlashbarItems).toHaveLength(1);
      expect(result.current.batteryFlashbarItems[0].type).toBe("error");
    });

    it("should set up polling interval", async () => {
      const mockResponse = {
        success: true,
        battery_level: 8,
      };

      mockApiData.get.mockResolvedValue(mockResponse);
      const setIntervalSpy = vi.spyOn(global, "setInterval");

      renderHook(() => useBatteryProvider());

      await waitFor(() => {
        expect(mockApiData.get).toHaveBeenCalledTimes(1);
      });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it("should cleanup interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useBatteryProvider());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("should handle authentication status change", () => {
      const { result, rerender } = renderHook(() => useBatteryProvider());

      // Initially authenticated, should call API if hasInitialReading is false
      // (may or may not be called depending on initial state)

      // Change to not authenticated
      mockAuthData.isAuthenticated = false;
      rerender();

      // Should maintain current state but not make new API calls
      expect(result.current.batteryLevel).toBe(0);
      expect(result.current.batteryError).toBe(false);
      expect(result.current.hasInitialReading).toBe(false);
      expect(result.current.batteryFlashbarItems).toEqual([]);
    });
  });
});
