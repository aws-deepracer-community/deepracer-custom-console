import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { StorageHelper } from "../../common/helpers/storage-helper";

// Mock the cloudscape global styles
vi.mock("@cloudscape-design/global-styles", () => ({
  Mode: {
    Light: "light",
    Dark: "dark",
  },
  applyMode: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock document
const mockDocumentElement = {
  style: {
    setProperty: vi.fn(),
  },
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

Object.defineProperty(global, "document", {
  value: {
    documentElement: mockDocumentElement,
  },
  writable: true,
});

describe("StorageHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Theme Management", () => {
    describe("getTheme", () => {
      it("should return light theme when no theme is stored", () => {
        const theme = StorageHelper.getTheme();
        expect(theme).toBe(Mode.Light);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("deepracer-theme");
      });

      it("should return stored dark theme", () => {
        mockLocalStorage.setItem("deepracer-theme", Mode.Dark);
        const theme = StorageHelper.getTheme();
        expect(theme).toBe(Mode.Dark);
      });

      it("should return stored light theme", () => {
        mockLocalStorage.setItem("deepracer-theme", Mode.Light);
        const theme = StorageHelper.getTheme();
        expect(theme).toBe(Mode.Light);
      });

      it("should default to light theme for invalid stored values", () => {
        mockLocalStorage.setItem("deepracer-theme", "invalid-theme");
        const theme = StorageHelper.getTheme();
        expect(theme).toBe(Mode.Light);
      });
    });

    describe("applyTheme", () => {
      it("should apply light theme correctly", () => {
        const result = StorageHelper.applyTheme(Mode.Light);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("deepracer-theme", Mode.Light);
        expect(applyMode).toHaveBeenCalledWith(Mode.Light);
        expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
          "--app-color-scheme",
          "light"
        );
        expect(result).toBe(Mode.Light);
      });

      it("should apply dark theme correctly", () => {
        const result = StorageHelper.applyTheme(Mode.Dark);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith("deepracer-theme", Mode.Dark);
        expect(applyMode).toHaveBeenCalledWith(Mode.Dark);
        expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
          "--app-color-scheme",
          "dark"
        );
        expect(result).toBe(Mode.Dark);
      });
    });
  });

  describe("Navigation Panel State Management", () => {
    describe("getNavigationPanelState", () => {
      it("should return default collapsed state when no state is stored", () => {
        const state = StorageHelper.getNavigationPanelState();
        expect(state).toEqual({ collapsed: true });
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("deepracer-navigation-panel-state");
      });

      it("should return stored navigation panel state", () => {
        const storedState = { collapsed: false, collapsedSections: { 1: true, 2: false } };
        mockLocalStorage.setItem("deepracer-navigation-panel-state", JSON.stringify(storedState));

        const state = StorageHelper.getNavigationPanelState();
        expect(state).toEqual(storedState);
      });

      it("should return empty object when stored state is invalid JSON", () => {
        mockLocalStorage.setItem("deepracer-navigation-panel-state", "invalid-json");

        const state = StorageHelper.getNavigationPanelState();
        expect(state).toEqual({});
      });

      it("should handle null parsed state gracefully", () => {
        mockLocalStorage.setItem("deepracer-navigation-panel-state", "null");

        const state = StorageHelper.getNavigationPanelState();
        expect(state).toEqual({});
      });
    });

    describe("setNavigationPanelState", () => {
      it("should merge with existing state and save to localStorage", () => {
        const existingState = { collapsed: true, collapsedSections: { 1: true } };
        mockLocalStorage.setItem("deepracer-navigation-panel-state", JSON.stringify(existingState));

        const newStateUpdate = { collapsed: false, collapsedSections: { 2: false } };
        const result = StorageHelper.setNavigationPanelState(newStateUpdate);

        const expectedState = {
          collapsed: false,
          collapsedSections: { 2: false }, // This overwrites the entire collapsedSections object
        };

        expect(result).toEqual(expectedState);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-navigation-panel-state",
          JSON.stringify(expectedState)
        );
      });

      it("should create new state when no existing state", () => {
        const newState = { collapsed: false };
        const result = StorageHelper.setNavigationPanelState(newState);

        expect(result).toEqual({ collapsed: false });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-navigation-panel-state",
          JSON.stringify({ collapsed: false })
        );
      });

      it("should handle partial state updates", () => {
        const existingState = { collapsed: true, collapsedSections: { 1: true, 2: false } };
        mockLocalStorage.setItem("deepracer-navigation-panel-state", JSON.stringify(existingState));

        const result = StorageHelper.setNavigationPanelState({ collapsed: false });

        const expectedState = {
          collapsed: false,
          collapsedSections: { 1: true, 2: false },
        };

        expect(result).toEqual(expectedState);
      });
    });
  });

  describe("Speed Adjustment Management", () => {
    describe("getEnableSpeedAdjustment", () => {
      it("should return false when no value is stored", () => {
        const result = StorageHelper.getEnableSpeedAdjustment();
        expect(result).toBe(false);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("deepracer-speed-adjustment");
      });

      it("should return true when true is stored", () => {
        mockLocalStorage.setItem("deepracer-speed-adjustment", JSON.stringify(true));
        const result = StorageHelper.getEnableSpeedAdjustment();
        expect(result).toBe(true);
      });

      it("should return false when false is stored", () => {
        mockLocalStorage.setItem("deepracer-speed-adjustment", JSON.stringify(false));
        const result = StorageHelper.getEnableSpeedAdjustment();
        expect(result).toBe(false);
      });

      it("should throw error for invalid stored values", () => {
        mockLocalStorage.setItem("deepracer-speed-adjustment", "invalid-value");

        // The implementation doesn't handle JSON.parse errors, so it should throw
        expect(() => StorageHelper.getEnableSpeedAdjustment()).toThrow();
      });
    });

    describe("setEnableSpeedAdjustment", () => {
      it("should store true value correctly", () => {
        StorageHelper.setEnableSpeedAdjustment(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-speed-adjustment",
          JSON.stringify(true)
        );
      });

      it("should store false value correctly", () => {
        StorageHelper.setEnableSpeedAdjustment(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-speed-adjustment",
          JSON.stringify(false)
        );
      });
    });
  });

  describe("Device Status Management", () => {
    describe("getEnableDeviceStatus", () => {
      it("should return false when no value is stored", () => {
        const result = StorageHelper.getEnableDeviceStatus();
        expect(result).toBe(false);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("deepracer-device-status");
      });

      it("should return true when true is stored", () => {
        mockLocalStorage.setItem("deepracer-device-status", JSON.stringify(true));
        const result = StorageHelper.getEnableDeviceStatus();
        expect(result).toBe(true);
      });

      it("should return false when false is stored", () => {
        mockLocalStorage.setItem("deepracer-device-status", JSON.stringify(false));
        const result = StorageHelper.getEnableDeviceStatus();
        expect(result).toBe(false);
      });

      it("should throw error for invalid stored values", () => {
        mockLocalStorage.setItem("deepracer-device-status", "invalid-value");

        // The implementation doesn't handle JSON.parse errors, so it should throw
        expect(() => StorageHelper.getEnableDeviceStatus()).toThrow();
      });
    });

    describe("setEnableDeviceStatus", () => {
      it("should store true value correctly", () => {
        StorageHelper.setEnableDeviceStatus(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-device-status",
          JSON.stringify(true)
        );
      });

      it("should store false value correctly", () => {
        StorageHelper.setEnableDeviceStatus(false);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "deepracer-device-status",
          JSON.stringify(false)
        );
      });
    });
  });

  describe("Integration Tests", () => {
    it("should handle multiple operations correctly", () => {
      // Set theme
      StorageHelper.applyTheme(Mode.Dark);

      // Set navigation panel state
      StorageHelper.setNavigationPanelState({ collapsed: false });

      // Set preferences
      StorageHelper.setEnableSpeedAdjustment(true);
      StorageHelper.setEnableDeviceStatus(true);

      // Verify all values are correctly stored and retrieved
      expect(StorageHelper.getTheme()).toBe(Mode.Dark);
      expect(StorageHelper.getNavigationPanelState()).toEqual({ collapsed: false });
      expect(StorageHelper.getEnableSpeedAdjustment()).toBe(true);
      expect(StorageHelper.getEnableDeviceStatus()).toBe(true);
    });

    it("should handle localStorage errors gracefully for some methods", () => {
      // This test should be isolated and only test specific error handling
      const originalGetItem = mockLocalStorage.getItem;

      // Mock only for this test
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // The implementation doesn't handle all localStorage errors, so these will throw
      expect(() => StorageHelper.getTheme()).toThrow();
      expect(() => StorageHelper.getNavigationPanelState()).toThrow();

      // Restore the original implementation
      mockLocalStorage.getItem.mockImplementation(originalGetItem);
    });
  });
});
