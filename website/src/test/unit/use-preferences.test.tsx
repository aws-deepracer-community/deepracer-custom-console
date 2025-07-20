import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import {
  usePreferences,
  usePreferencesProvider,
  PreferencesContext,
  Settings,
} from "../../common/hooks/use-preferences";

// Mock StorageHelper to avoid vitest hoisting issues
vi.mock("../../common/helpers/storage-helper", () => ({
  StorageHelper: {
    getEnableSpeedAdjustment: vi.fn(),
    getEnableDeviceStatus: vi.fn(),
    setEnableSpeedAdjustment: vi.fn(),
    setEnableDeviceStatus: vi.fn(),
  },
}));

// Get reference to the mocked functions
import { StorageHelper } from "../../common/helpers/storage-helper";
const mockStorageHelper = vi.mocked(StorageHelper);

// Types
interface PreferencesContextType {
  settings: Settings;
  setEnableSpeedAdjustment: (value: boolean) => void;
  setEnableDeviceStatus: (value: boolean) => void;
}

// Test wrapper component for PreferencesContext
const createWrapper = (preferencesValue: PreferencesContextType) => {
  return ({ children }: { children: ReactNode }) => (
    <PreferencesContext.Provider value={preferencesValue}>{children}</PreferencesContext.Provider>
  );
};

describe("usePreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return values
    mockStorageHelper.getEnableSpeedAdjustment.mockReturnValue(true);
    mockStorageHelper.getEnableDeviceStatus.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw error when used outside of PreferencesProvider", () => {
    expect(() => {
      renderHook(() => usePreferences());
    }).toThrow("usePreferences must be used within a PreferencesProvider");
  });

  it("should return context value when used within PreferencesProvider", () => {
    const mockPreferencesState = {
      settings: {
        enableSpeedAdjustment: true,
        enableDeviceStatus: false,
      },
      setEnableSpeedAdjustment: vi.fn(),
      setEnableDeviceStatus: vi.fn(),
    };

    const wrapper = createWrapper(mockPreferencesState);
    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current).toBe(mockPreferencesState);
    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
    expect(result.current.settings.enableDeviceStatus).toBe(false);
  });
});

describe("usePreferencesProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return values
    mockStorageHelper.getEnableSpeedAdjustment.mockReturnValue(true);
    mockStorageHelper.getEnableDeviceStatus.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize settings from StorageHelper", () => {
    mockStorageHelper.getEnableSpeedAdjustment.mockReturnValue(true);
    mockStorageHelper.getEnableDeviceStatus.mockReturnValue(false);

    const { result } = renderHook(() => usePreferencesProvider());

    expect(mockStorageHelper.getEnableSpeedAdjustment).toHaveBeenCalledOnce();
    expect(mockStorageHelper.getEnableDeviceStatus).toHaveBeenCalledOnce();
    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
    expect(result.current.settings.enableDeviceStatus).toBe(false);
  });

  it("should initialize with default false values when StorageHelper returns false", () => {
    mockStorageHelper.getEnableSpeedAdjustment.mockReturnValue(false);
    mockStorageHelper.getEnableDeviceStatus.mockReturnValue(false);

    const { result } = renderHook(() => usePreferencesProvider());

    expect(result.current.settings.enableSpeedAdjustment).toBe(false);
    expect(result.current.settings.enableDeviceStatus).toBe(false);
  });

  it("should update enableSpeedAdjustment setting", () => {
    const { result } = renderHook(() => usePreferencesProvider());

    act(() => {
      result.current.setEnableSpeedAdjustment(false);
    });

    expect(mockStorageHelper.setEnableSpeedAdjustment).toHaveBeenCalledWith(false);
    expect(result.current.settings.enableSpeedAdjustment).toBe(false);
    // Should not affect other settings
    expect(result.current.settings.enableDeviceStatus).toBe(true);
  });

  it("should update enableDeviceStatus setting", () => {
    const { result } = renderHook(() => usePreferencesProvider());

    act(() => {
      result.current.setEnableDeviceStatus(false);
    });

    expect(mockStorageHelper.setEnableDeviceStatus).toHaveBeenCalledWith(false);
    expect(result.current.settings.enableDeviceStatus).toBe(false);
    // Should not affect other settings
    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
  });

  it("should handle multiple setting updates independently", () => {
    const { result } = renderHook(() => usePreferencesProvider());

    // Update speed adjustment
    act(() => {
      result.current.setEnableSpeedAdjustment(false);
    });

    expect(mockStorageHelper.setEnableSpeedAdjustment).toHaveBeenCalledWith(false);
    expect(result.current.settings.enableSpeedAdjustment).toBe(false);
    expect(result.current.settings.enableDeviceStatus).toBe(true);

    // Update device status
    act(() => {
      result.current.setEnableDeviceStatus(false);
    });

    expect(mockStorageHelper.setEnableDeviceStatus).toHaveBeenCalledWith(false);
    expect(result.current.settings.enableSpeedAdjustment).toBe(false);
    expect(result.current.settings.enableDeviceStatus).toBe(false);

    // Verify both storage calls were made
    expect(mockStorageHelper.setEnableSpeedAdjustment).toHaveBeenCalledTimes(1);
    expect(mockStorageHelper.setEnableDeviceStatus).toHaveBeenCalledTimes(1);
  });

  it("should toggle settings back and forth", () => {
    const { result } = renderHook(() => usePreferencesProvider());

    // Start with initial values (true, true)
    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
    expect(result.current.settings.enableDeviceStatus).toBe(true);

    // Toggle speed adjustment off
    act(() => {
      result.current.setEnableSpeedAdjustment(false);
    });
    expect(result.current.settings.enableSpeedAdjustment).toBe(false);

    // Toggle speed adjustment back on
    act(() => {
      result.current.setEnableSpeedAdjustment(true);
    });
    expect(result.current.settings.enableSpeedAdjustment).toBe(true);

    // Toggle device status off
    act(() => {
      result.current.setEnableDeviceStatus(false);
    });
    expect(result.current.settings.enableDeviceStatus).toBe(false);

    // Toggle device status back on
    act(() => {
      result.current.setEnableDeviceStatus(true);
    });
    expect(result.current.settings.enableDeviceStatus).toBe(true);

    // Verify storage calls
    expect(mockStorageHelper.setEnableSpeedAdjustment).toHaveBeenCalledTimes(2);
    expect(mockStorageHelper.setEnableDeviceStatus).toHaveBeenCalledTimes(2);
  });

  it("should maintain function reference stability", () => {
    const { result, rerender } = renderHook(() => usePreferencesProvider());

    const initialSetEnableSpeedAdjustment = result.current.setEnableSpeedAdjustment;
    const initialSetEnableDeviceStatus = result.current.setEnableDeviceStatus;

    // Trigger a re-render
    rerender();

    // Functions should be the same reference due to useCallback
    expect(result.current.setEnableSpeedAdjustment).toBe(initialSetEnableSpeedAdjustment);
    expect(result.current.setEnableDeviceStatus).toBe(initialSetEnableDeviceStatus);
  });

  it("should handle mixed initial storage values", () => {
    mockStorageHelper.getEnableSpeedAdjustment.mockReturnValue(true);
    mockStorageHelper.getEnableDeviceStatus.mockReturnValue(false);

    const { result } = renderHook(() => usePreferencesProvider());

    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
    expect(result.current.settings.enableDeviceStatus).toBe(false);

    // Update only the false one to true
    act(() => {
      result.current.setEnableDeviceStatus(true);
    });

    expect(result.current.settings.enableSpeedAdjustment).toBe(true);
    expect(result.current.settings.enableDeviceStatus).toBe(true);
  });
});
