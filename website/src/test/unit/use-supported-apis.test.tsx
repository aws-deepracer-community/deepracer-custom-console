import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { ReactNode } from "react";
import {
  useSupportedApis,
  useSupportedApisProvider,
  SupportedApisContext,
} from "../../common/hooks/use-supported-apis";

// Mock ApiHelper to avoid vitest hoisting issues
vi.mock("../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock("../../common/hooks/use-authentication", () => ({
  useAuth: vi.fn(),
}));

// Mock console.error to avoid noise in tests
vi.mock("console", () => ({
  error: vi.fn(),
}));

// Get reference to the mocked functions
import { ApiHelper } from "../../common/helpers/api-helper";
import { useAuth } from "../../common/hooks/use-authentication";
const mockApiHelper = vi.mocked(ApiHelper);
const mockUseAuth = vi.mocked(useAuth);

// Types
interface SupportedApisState {
  supportedApis: string[];
  isEmergencyStopSupported: boolean;
  isDeviceStatusSupported: boolean;
  isTimeApiSupported: boolean;
  isLoading: boolean;
  hasError: boolean;
}

// Test wrapper component for SupportedApisContext
const createWrapper = (supportedApisValue: SupportedApisState) => {
  return ({ children }: { children: ReactNode }) => (
    <SupportedApisContext.Provider value={supportedApisValue}>
      {children}
    </SupportedApisContext.Provider>
  );
};

describe("useSupportedApis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw error when used outside of SupportedApisProvider", () => {
    expect(() => {
      renderHook(() => useSupportedApis());
    }).toThrow("useSupportedApis must be used within a SupportedApisProvider");
  });

  it("should return context value when used within SupportedApisProvider", () => {
    const mockSupportedApisState = {
      supportedApis: ["/api/emergency_stop", "/api/get_device_status"],
      isEmergencyStopSupported: true,
      isDeviceStatusSupported: true,
      isTimeApiSupported: false,
      isLoading: false,
      hasError: false,
    };

    const wrapper = createWrapper(mockSupportedApisState);
    const { result } = renderHook(() => useSupportedApis(), { wrapper });

    expect(result.current).toBe(mockSupportedApisState);
    expect(result.current.supportedApis).toEqual(["/api/emergency_stop", "/api/get_device_status"]);
    expect(result.current.isEmergencyStopSupported).toBe(true);
    expect(result.current.isDeviceStatusSupported).toBe(true);
    expect(result.current.isTimeApiSupported).toBe(false);
  });
});

describe("useSupportedApisProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when not authenticated", () => {
    it("should reset state and not fetch data when not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.supportedApis).toEqual([]);
        expect(result.current.isEmergencyStopSupported).toBe(false);
        expect(result.current.isDeviceStatusSupported).toBe(false);
        expect(result.current.isTimeApiSupported).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasError).toBe(false);
      });

      expect(mockApiHelper.get).not.toHaveBeenCalled();
    });
  });

  describe("when authenticated", () => {
    it("should fetch supported APIs successfully", async () => {
      const mockResponse = {
        success: true,
        apis_supported: ["/api/emergency_stop", "/api/get_device_status", "/api/get_time"],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSupportedApisProvider());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiHelper.get).toHaveBeenCalledWith("supported_apis");
      expect(result.current.supportedApis).toEqual([
        "/api/emergency_stop",
        "/api/get_device_status",
        "/api/get_time",
      ]);
      expect(result.current.isEmergencyStopSupported).toBe(true);
      expect(result.current.isDeviceStatusSupported).toBe(true);
      expect(result.current.isTimeApiSupported).toBe(true);
      expect(result.current.hasError).toBe(false);
    });

    it("should handle partial API support", async () => {
      const mockResponse = {
        success: true,
        apis_supported: ["/api/emergency_stop"],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual(["/api/emergency_stop"]);
      expect(result.current.isEmergencyStopSupported).toBe(true);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it("should handle no supported APIs", async () => {
      const mockResponse = {
        success: true,
        apis_supported: [],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it("should handle unsuccessful API response", async () => {
      const mockResponse = {
        success: false,
        apis_supported: ["/api/emergency_stop"],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(true);
    });

    it("should handle null API response", async () => {
      mockApiHelper.get.mockResolvedValue(null);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(true);
    });

    it("should handle undefined API response", async () => {
      mockApiHelper.get.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(true);
    });

    it("should handle API error", async () => {
      const mockError = new Error("Network error");
      mockApiHelper.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(false);
      expect(result.current.hasError).toBe(true);
    });

    it("should handle authentication status change from authenticated to not authenticated", async () => {
      const mockResponse = {
        success: true,
        apis_supported: ["/api/emergency_stop", "/api/get_device_status"],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result, rerender } = renderHook(() => useSupportedApisProvider());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([
        "/api/emergency_stop",
        "/api/get_device_status",
      ]);
      expect(result.current.isEmergencyStopSupported).toBe(true);
      expect(result.current.isDeviceStatusSupported).toBe(true);

      // Change to not authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.supportedApis).toEqual([]);
        expect(result.current.isEmergencyStopSupported).toBe(false);
        expect(result.current.isDeviceStatusSupported).toBe(false);
        expect(result.current.isTimeApiSupported).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasError).toBe(false);
      });
    });

    it("should handle authentication status change from not authenticated to authenticated", async () => {
      // Start not authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useSupportedApisProvider());

      // Should not fetch initially
      expect(result.current.supportedApis).toEqual([]);
      expect(result.current.isLoading).toBe(false);

      // Change to authenticated
      const mockResponse = {
        success: true,
        apis_supported: ["/api/get_time"],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiHelper.get).toHaveBeenCalledWith("supported_apis");
      expect(result.current.supportedApis).toEqual(["/api/get_time"]);
      expect(result.current.isEmergencyStopSupported).toBe(false);
      expect(result.current.isDeviceStatusSupported).toBe(false);
      expect(result.current.isTimeApiSupported).toBe(true);
      expect(result.current.hasError).toBe(false);
    });

    it("should handle API response with different API combinations", async () => {
      const testCases = [
        {
          apis: ["/api/emergency_stop"],
          expected: { emergency: true, device: false, time: false },
        },
        {
          apis: ["/api/get_device_status"],
          expected: { emergency: false, device: true, time: false },
        },
        {
          apis: ["/api/get_time"],
          expected: { emergency: false, device: false, time: true },
        },
        {
          apis: ["/api/emergency_stop", "/api/get_time"],
          expected: { emergency: true, device: false, time: true },
        },
        {
          apis: ["/api/get_device_status", "/api/get_time"],
          expected: { emergency: false, device: true, time: true },
        },
        {
          apis: ["/api/emergency_stop", "/api/get_device_status"],
          expected: { emergency: true, device: true, time: false },
        },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          success: true,
          apis_supported: testCase.apis,
        };
        mockApiHelper.get.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useSupportedApisProvider());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.supportedApis).toEqual(testCase.apis);
        expect(result.current.isEmergencyStopSupported).toBe(testCase.expected.emergency);
        expect(result.current.isDeviceStatusSupported).toBe(testCase.expected.device);
        expect(result.current.isTimeApiSupported).toBe(testCase.expected.time);
        expect(result.current.hasError).toBe(false);

        // Reset for next iteration
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
        });
      }
    });

    it("should handle API response with unknown APIs", async () => {
      const mockResponse = {
        success: true,
        apis_supported: [
          "/api/emergency_stop",
          "/api/unknown_api",
          "/api/get_device_status",
          "/api/another_unknown",
          "/api/get_time",
        ],
      };
      mockApiHelper.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSupportedApisProvider());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.supportedApis).toEqual([
        "/api/emergency_stop",
        "/api/unknown_api",
        "/api/get_device_status",
        "/api/another_unknown",
        "/api/get_time",
      ]);
      expect(result.current.isEmergencyStopSupported).toBe(true);
      expect(result.current.isDeviceStatusSupported).toBe(true);
      expect(result.current.isTimeApiSupported).toBe(true);
      expect(result.current.hasError).toBe(false);
    });

    it("should not cause memory leaks when component unmounts during API call", async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { success: boolean; apis_supported: string[] }) => void;
      const delayedPromise = new Promise<{ success: boolean; apis_supported: string[] }>(
        (resolve) => {
          resolvePromise = resolve;
        }
      );
      mockApiHelper.get.mockReturnValue(delayedPromise);

      const { result, unmount } = renderHook(() => useSupportedApisProvider());

      expect(result.current.isLoading).toBe(true);

      // Unmount before the API call completes
      unmount();

      // Complete the API call after unmount
      act(() => {
        resolvePromise!({
          success: true,
          apis_supported: ["/api/emergency_stop"],
        });
      });

      // No assertions needed - we're just testing that no errors are thrown
      // and no state updates occur after unmount
    });
  });
});
