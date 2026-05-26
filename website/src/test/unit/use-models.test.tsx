import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useModels, useModelsProvider, ModelsContext } from "../../common/hooks/use-models";
import { FlashbarProps } from "@cloudscape-design/components";
import { ReactNode } from "react";

// Mock the authentication hook
const mockAuthData = {
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("../../common/hooks/use-authentication", () => ({
  useAuth: () => mockAuthData,
}));

// Mock ApiHelper
vi.mock("../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Import the mocked module to access the mock functions
import { ApiHelper } from "../../common/helpers/api-helper";
const mockApiHelper = vi.mocked(ApiHelper);

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

// Types
interface ModelOption {
  label: string;
  value: string;
  description: string;
  disabled: boolean;
}

interface ModelsContextState {
  modelOptions: ModelOption[];
  selectedModel: ModelOption | null;
  isModelLoaded: boolean;
  isModelLoading: boolean;
  setSelectedModel: (model: ModelOption | null) => void;
  loadModel: (modelName: string) => Promise<boolean>;
  reloadModels: () => Promise<void>;
  loadStatus: {
    loading: boolean;
    success: boolean | null;
    error: string | null;
  };
  modelFlashbarItems: FlashbarProps.MessageDefinition[];
  clearModelFlashbar: () => void;
  checkModelLoadStatus: () => Promise<boolean>;
}

// Test wrapper component for ModelsContext
const createWrapper = (modelsValue: ModelsContextState) => {
  return ({ children }: { children: ReactNode }) => (
    <ModelsContext.Provider value={modelsValue}>{children}</ModelsContext.Provider>
  );
};

describe("useModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data to defaults
    mockAuthData.isAuthenticated = true;
    mockApiHelper.get.mockReset();
    mockApiHelper.post.mockReset();
    mockAuthData.login.mockReset();
    mockAuthData.logout.mockReset();
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();
    mockSessionStorage.removeItem.mockReset();
    mockSessionStorage.clear.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw error when used outside of ModelsProvider", () => {
    expect(() => {
      renderHook(() => useModels());
    }).toThrow("useModels must be used within a ModelsProvider");
  });

  it("should return context value when used within ModelsProvider", () => {
    const mockModelsState = {
      modelOptions: [{ label: "Model1", value: "model1", description: "Camera", disabled: false }],
      selectedModel: null,
      isModelLoaded: false,
      isModelLoading: false,
      setSelectedModel: vi.fn(),
      loadModel: vi.fn(),
      reloadModels: vi.fn(),
      loadStatus: { loading: false, success: null, error: null },
      modelFlashbarItems: [],
      clearModelFlashbar: vi.fn(),
      checkModelLoadStatus: vi.fn(),
    };

    const wrapper = createWrapper(mockModelsState);
    const { result } = renderHook(() => useModels(), { wrapper });

    expect(result.current).toBe(mockModelsState);
    expect(result.current.modelOptions).toHaveLength(1);
    expect(result.current.selectedModel).toBe(null);
    expect(result.current.isModelLoaded).toBe(false);
    expect(result.current.isModelLoading).toBe(false);
  });
});

describe("useModelsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use real timers to avoid complications
    vi.useRealTimers();

    // Reset mock data to defaults
    mockAuthData.isAuthenticated = true;
    mockApiHelper.get.mockReset();
    mockApiHelper.post.mockReset();
    mockAuthData.login.mockReset();
    mockAuthData.logout.mockReset();
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();
    mockSessionStorage.removeItem.mockReset();
    mockSessionStorage.clear.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when not authenticated", () => {
    it("should reset state and not fetch data", async () => {
      // Set authentication to false for this test
      mockAuthData.isAuthenticated = false;

      const { result } = renderHook(() => useModelsProvider());

      expect(result.current.modelOptions).toEqual([]);
      expect(result.current.selectedModel).toBe(null);
      expect(result.current.isModelLoaded).toBe(false);
      expect(result.current.isModelLoading).toBe(false);
      expect(result.current.modelFlashbarItems).toEqual([]);
      expect(mockApiHelper.get).not.toHaveBeenCalled();
    });
  });

  describe("when authenticated", () => {
    it("should fetch models successfully", async () => {
      const mockModelsResponse = {
        models: [
          {
            model_folder_name: "model1",
            model_sensors: ["camera"],
            is_select_disabled: false,
          },
          {
            model_folder_name: "model2",
            model_sensors: ["camera", "lidar"],
            is_select_disabled: true,
          },
        ],
      };

      const mockLoadStatusResponse = {
        success: true,
        isModelLoading: "loaded",
      };

      mockApiHelper.get
        .mockResolvedValueOnce(mockLoadStatusResponse) // checkModelLoadStatus
        .mockResolvedValueOnce(mockModelsResponse); // fetchModels

      const { result } = renderHook(() => useModelsProvider());

      await waitFor(() => {
        expect(result.current.modelOptions).toHaveLength(2);
      });

      expect(result.current.modelOptions[0]).toEqual({
        label: "model1",
        value: "model1",
        description: "camera",
        disabled: false,
      });
      expect(result.current.modelOptions[1]).toEqual({
        label: "model2",
        value: "model2",
        description: "camera, lidar",
        disabled: true,
      });
      expect(result.current.isModelLoaded).toBe(true);
      expect(mockApiHelper.get).toHaveBeenCalledWith("isModelLoading");
      expect(mockApiHelper.get).toHaveBeenCalledWith("models");
    });

    it("should restore previously selected model from sessionStorage", async () => {
      const mockModelsResponse = {
        models: [
          {
            model_folder_name: "saved-model",
            model_sensors: ["camera"],
            is_select_disabled: false,
          },
        ],
      };

      const mockLoadStatusResponse = {
        success: true,
        isModelLoading: "loaded",
      };

      mockSessionStorage.getItem.mockReturnValue("saved-model");
      mockApiHelper.get
        .mockResolvedValueOnce(mockLoadStatusResponse)
        .mockResolvedValueOnce(mockModelsResponse);

      const { result } = renderHook(() => useModelsProvider());

      await waitFor(() => {
        expect(result.current.selectedModel?.value).toBe("saved-model");
      });

      expect(result.current.selectedModel).toEqual({
        label: "saved-model",
        value: "saved-model",
        description: "camera",
        disabled: false,
      });
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith("selectedModelName");
    });

    it("should handle checkModelLoadStatus - loading state", async () => {
      const mockLoadStatusResponse = {
        success: true,
        isModelLoading: "loading",
      };

      mockApiHelper.get.mockResolvedValueOnce(mockLoadStatusResponse);

      const { result } = renderHook(() => useModelsProvider());

      await waitFor(() => {
        expect(result.current.isModelLoading).toBe(true);
      });

      expect(result.current.isModelLoaded).toBe(false);
      expect(result.current.isModelLoading).toBe(true);
    });

    it("should handle checkModelLoadStatus - not loaded state", async () => {
      const mockLoadStatusResponse = {
        success: true,
        isModelLoading: "failed",
      };

      mockApiHelper.get.mockResolvedValueOnce(mockLoadStatusResponse);

      const { result } = renderHook(() => useModelsProvider());

      await waitFor(() => {
        expect(result.current.isModelLoaded).toBe(false);
      });

      expect(result.current.isModelLoaded).toBe(false);
      expect(result.current.isModelLoading).toBe(false);
      expect(result.current.selectedModel).toBe(null);
    });

    it("should handle API error in checkModelLoadStatus", async () => {
      const mockError = new Error("API request failed");
      mockApiHelper.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useModelsProvider());

      await waitFor(() => {
        expect(result.current.isModelLoaded).toBe(false);
      });

      expect(result.current.isModelLoaded).toBe(false);
      expect(result.current.isModelLoading).toBe(false);
      expect(result.current.selectedModel).toBe(null);
    });

    it("should load model successfully", async () => {
      const mockLoadResponse = {
        success: true,
      };

      const mockStatusResponse = {
        success: true,
        isModelLoading: "loaded",
      };

      mockApiHelper.post.mockResolvedValueOnce(mockLoadResponse);
      mockApiHelper.get.mockResolvedValue(mockStatusResponse); // for polling

      const { result } = renderHook(() => useModelsProvider());

      let loadResult: boolean;
      await act(async () => {
        loadResult = await result.current.loadModel("test-model");
      });

      expect(loadResult!).toBe(true);
      expect(mockApiHelper.post).toHaveBeenCalledWith("models/test-model/model", {});
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith("selectedModelName", "test-model");

      // Wait for polling to complete
      await waitFor(() => {
        expect(result.current.loadStatus.success).toBe(true);
      });

      expect(result.current.isModelLoaded).toBe(true);
      expect(result.current.isModelLoading).toBe(false);
    });

    it("should handle load model API failure", async () => {
      const mockLoadResponse = {
        success: false,
      };

      mockApiHelper.post.mockResolvedValueOnce(mockLoadResponse);

      const { result } = renderHook(() => useModelsProvider());

      let loadResult: boolean;
      await act(async () => {
        loadResult = await result.current.loadModel("test-model");
      });

      expect(loadResult!).toBe(false);
      expect(result.current.loadStatus.success).toBe(false);
      expect(result.current.loadStatus.error).toBe("Failed to load model");
      expect(result.current.isModelLoading).toBe(false);
    });

    it("should handle load model API error", async () => {
      const mockError = new Error("Network error");
      mockApiHelper.post.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useModelsProvider());

      let loadResult: boolean;
      await act(async () => {
        loadResult = await result.current.loadModel("test-model");
      });

      expect(loadResult!).toBe(false);
      expect(result.current.loadStatus.success).toBe(false);
      expect(result.current.loadStatus.error).toBe("Network error");
      expect(result.current.isModelLoading).toBe(false);
    });

    it("should reload models", async () => {
      const mockLoadStatusResponse = {
        success: true,
        isModelLoading: "loaded",
      };

      const mockModelsResponse = {
        models: [
          {
            model_folder_name: "reloaded-model",
            model_sensors: ["camera"],
            is_select_disabled: false,
          },
        ],
      };

      mockApiHelper.get
        .mockResolvedValueOnce(mockLoadStatusResponse) // initial load
        .mockResolvedValueOnce(mockModelsResponse) // initial fetch
        .mockResolvedValueOnce(mockLoadStatusResponse) // reload check
        .mockResolvedValueOnce(mockModelsResponse); // reload fetch

      const { result } = renderHook(() => useModelsProvider());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.modelOptions).toHaveLength(1);
      });

      // Trigger reload
      await act(async () => {
        await result.current.reloadModels();
      });

      expect(mockApiHelper.get).toHaveBeenCalledTimes(4); // 2 for initial, 2 for reload
    });

    it("should show loading flashbar when loading model", async () => {
      const mockLoadResponse = {
        success: true,
      };

      // Mock the post to resolve after a delay to keep it in loading state
      mockApiHelper.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLoadResponse), 100))
      );

      const { result } = renderHook(() => useModelsProvider());

      // Start the loading process but don't await it
      act(() => {
        result.current.loadModel("test-model");
      });

      // Check loading state immediately
      expect(result.current.modelFlashbarItems).toHaveLength(1);
      expect(result.current.modelFlashbarItems[0].type).toBe("in-progress");
      expect(result.current.modelFlashbarItems[0].content).toBe("Model loading...");
      expect(result.current.modelFlashbarItems[0].loading).toBe(true);
    });

    it("should show success flashbar when model loads successfully", async () => {
      const mockLoadResponse = {
        success: true,
      };

      const mockStatusResponse = {
        success: true,
        isModelLoading: "loaded",
      };

      mockApiHelper.post.mockResolvedValueOnce(mockLoadResponse);
      mockApiHelper.get.mockResolvedValue(mockStatusResponse);

      const { result } = renderHook(() => useModelsProvider());

      await act(async () => {
        await result.current.loadModel("test-model");
      });

      // Wait for success state
      await waitFor(() => {
        expect(result.current.loadStatus.success).toBe(true);
      });

      expect(result.current.modelFlashbarItems).toHaveLength(1);
      expect(result.current.modelFlashbarItems[0].type).toBe("success");
      expect(result.current.modelFlashbarItems[0].content).toBe("Model loaded successfully");
    });

    it("should show error flashbar when model loading fails", async () => {
      const mockLoadResponse = {
        success: false,
      };

      mockApiHelper.post.mockResolvedValueOnce(mockLoadResponse);

      const { result } = renderHook(() => useModelsProvider());

      await act(async () => {
        await result.current.loadModel("test-model");
      });

      expect(result.current.modelFlashbarItems).toHaveLength(1);
      expect(result.current.modelFlashbarItems[0].type).toBe("error");
      expect(result.current.modelFlashbarItems[0].content).toBe(
        "Error loading model: Failed to load model"
      );
    });

    it("should clear flashbar items", async () => {
      const { result } = renderHook(() => useModelsProvider());

      // Trigger error state to show flashbar
      await act(async () => {
        await result.current.loadModel("test-model");
      });

      expect(result.current.modelFlashbarItems).toHaveLength(1);

      // Clear flashbar
      act(() => {
        result.current.clearModelFlashbar();
      });

      expect(result.current.modelFlashbarItems).toHaveLength(0);
    });

    it("should set selected model", () => {
      const { result } = renderHook(() => useModelsProvider());

      const testModel = {
        label: "test-model",
        value: "test-model",
        description: "camera",
        disabled: false,
      };

      act(() => {
        result.current.setSelectedModel(testModel);
      });

      expect(result.current.selectedModel).toBe(testModel);
    });

    it("should handle authentication status change", async () => {
      const { result, rerender } = renderHook(() => useModelsProvider());

      // Initially authenticated
      expect(result.current.modelOptions).toEqual([]);

      // Change to not authenticated
      mockAuthData.isAuthenticated = false;
      rerender();

      expect(result.current.modelOptions).toEqual([]);
      expect(result.current.selectedModel).toBe(null);
      expect(result.current.isModelLoaded).toBe(false);
      expect(result.current.isModelLoading).toBe(false);
      expect(result.current.modelFlashbarItems).toEqual([]);
    });
  });
});
