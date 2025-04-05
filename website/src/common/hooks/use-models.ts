import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { FlashbarProps } from "@cloudscape-design/components";
import { ApiHelper } from "../helpers/api-helper";
import { useAuth } from "./use-authentication";

// Types for model-related responses
interface ModelResponse {
  model_folder_name: string;
  model_sensors: string[];
  is_select_disabled: boolean;
}

interface ModelsResponse {
  models: ModelResponse[];
}

interface ModelLoadingResponse {
  success: boolean;
  isModelLoading: string;
}

interface ModelOption {
  label: string;
  value: string;
  description: string;
  disabled: boolean;
}

// Context interface
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
  // Add flashbar items to the context
  modelFlashbarItems: FlashbarProps.MessageDefinition[];
  clearModelFlashbar: () => void;
}

export const ModelsContext = createContext<ModelsContextState | null>(null);

export const useModels = () => {
  const context = useContext(ModelsContext);
  if (!context) {
    throw new Error("useModels must be used within a ModelsProvider");
  }
  return context;
};

export const useModelsProvider = () => {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelOption | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [loadStatus, setLoadStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    error: string | null;
  }>({
    loading: false,
    success: null,
    error: null,
  });
  const { isAuthenticated } = useAuth();

  // Add state for flashbar items
  const [modelFlashbarItems, setModelFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>(
    []
  );

  // Function to clear flashbar items
  const clearModelFlashbar = useCallback(() => {
    setModelFlashbarItems([]);
  }, []);

  // Function to fetch available models
  const fetchModels = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return [];
    }

    try {
      const response = await ApiHelper.get<ModelsResponse>("models");
      if (response) {
        const options = response.models.map((model) => ({
          label: model.model_folder_name,
          value: model.model_folder_name,
          description: model.model_sensors.join(", "),
          disabled: model.is_select_disabled,
        }));
        setModelOptions(options);

        // Restore previously selected model if it exists in the new list
        const selectedModelName = localStorage.getItem("selectedModelName");
        if (selectedModelName) {
          const previousModel = options.find((model) => model.value === selectedModelName);
          if (previousModel && isModelLoaded) {
            setSelectedModel(previousModel);
          } else {
            // If the previous model is not found, clear the selection
            setSelectedModel(null); 
          }
        }

        return options;
      }
      return [];
    } catch (error) {
      console.error("Error fetching models:", error);
      return [];
    }
  }, [isAuthenticated, isModelLoaded]);

  // Function to check if a model is currently loaded
  const checkModelLoadStatus = useCallback(async () => {
    // Don't check if not authenticated
    if (!isAuthenticated) {
      return false;
    }

    try {
      const response = await ApiHelper.get<ModelLoadingResponse>("isModelLoading");
      if (response?.isModelLoading === "loaded" && response?.success) {
        setIsModelLoaded(true);
        setIsModelLoading(false);
        return true;
      } else if (response?.isModelLoading === "loading") {
        setIsModelLoaded(false);
        setIsModelLoading(true);
        return false;
      } else {
        setIsModelLoaded(false);
        setIsModelLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking model status:", error);
      setIsModelLoaded(false);
      setIsModelLoading(false);
      return false;
    }
  }, [isAuthenticated]);

  // Function to poll for model loading status with retry limit
  const pollModelLoadingStatus = useCallback(
    (retryCount = 0) => {
      // Don't poll if not authenticated
      if (!isAuthenticated) {
        return;
      }

      // Maximum number of retries (30 seconds with 1-second interval)
      const MAX_RETRIES = 30;

      if (retryCount >= MAX_RETRIES) {
        // Too many retries, stop polling
        setLoadStatus({
          loading: false,
          success: false,
          error: "Model loading timed out",
        });
        return;
      }

      // Check model status
      ApiHelper.get<ModelLoadingResponse>("isModelLoading")
        .then((response) => {
          if (response?.success) {
            if (response.isModelLoading === "loaded") {
              // Model loaded successfully
              setIsModelLoaded(true);
              setIsModelLoading(false);
              setLoadStatus({
                loading: false,
                success: true,
                error: null,
              });
            } else if (response.isModelLoading === "loading") {
              // Still loading, continue polling
              setIsModelLoaded(false);
              setIsModelLoading(true);
              setTimeout(() => pollModelLoadingStatus(retryCount + 1), 1000);
            } else if (response.isModelLoading === "failed") {
              // Loading failed
              setIsModelLoaded(false);
              setIsModelLoading(false);
              setLoadStatus({
                loading: false,
                success: false,
                error: "Model loading failed",
              });
            } else {
              // Unknown state, try again
              setIsModelLoaded(false);
              setIsModelLoading(false);
              setTimeout(() => pollModelLoadingStatus(retryCount + 1), 1000);
            }
          } else {
            // API call failed
            setIsModelLoaded(false);
            setIsModelLoading(false);
            setLoadStatus({
              loading: false,
              success: false,
              error: "Error checking model loading status",
            });
          }
        })
        .catch((error) => {
          console.error("Error polling model status:", error);
          setIsModelLoaded(false);
          setIsModelLoading(false);
          setLoadStatus({
            loading: false,
            success: false,
            error: error instanceof Error ? error.message : "Error checking model status",
          });
        });
    },
    [isAuthenticated]
  );

  // Function to load a model
  const loadModel = useCallback(
    async (modelName: string) => {
      // Don't load if not authenticated
      if (!isAuthenticated) {
        return false;
      }

      try {
        // Reset states
        setLoadStatus({
          loading: true,
          success: null,
          error: null,
        });
        setIsModelLoaded(false);
        setIsModelLoading(true);

        const modelResponse = await ApiHelper.post<{ success: boolean }>(
          `models/${modelName}/model`,
          {}
        );

        if (modelResponse?.success) {
          localStorage.setItem("selectedModelName", modelName);

          // Start polling with initial retry count of 0
          pollModelLoadingStatus(0);
          return true;
        } else {
          setIsModelLoading(false);
          setLoadStatus({
            loading: false,
            success: false,
            error: "Failed to load model",
          });
          return false;
        }
      } catch (error) {
        console.error("Error loading model:", error);
        setIsModelLoading(false);
        setLoadStatus({
          loading: false,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error loading model",
        });
        return false;
      }
    },
    [pollModelLoadingStatus, isAuthenticated]
  );

  // Function to reload models list
  const reloadModels = useCallback(async () => {
    // Don't reload if not authenticated
    if (!isAuthenticated) {
      return;
    }

    await fetchModels();
    await checkModelLoadStatus();
  }, [fetchModels, checkModelLoadStatus, isAuthenticated]);

  // Initialize models and check status on mount
  useEffect(() => {
    // Don't initialize if not authenticated
    if (!isAuthenticated) {
      // Reset state when authentication is lost
      setModelOptions([]);
      setSelectedModel(null);
      setIsModelLoaded(false);
      setIsModelLoading(false);
      setLoadStatus({
        loading: false,
        success: null,
        error: null,
      });
      setModelFlashbarItems([]);
      return;
    }

    const initialize = async () => {
      const options = await fetchModels();
      await checkModelLoadStatus();

      // Restore previously selected model
      const selectedModelName = localStorage.getItem("selectedModelName");
      if (selectedModelName && options.length > 0) {
        const previousModel = options.find((model) => model.value === selectedModelName);
        if (previousModel) {
          setSelectedModel(previousModel);
        }
      }
    };

    initialize();
  }, [fetchModels, checkModelLoadStatus, isAuthenticated]);

  // Update flashbar items based on loadStatus
  useEffect(() => {
    // Don't show flashbar items if not authenticated
    if (!isAuthenticated) {
      setModelFlashbarItems([]);
      return;
    }

    if (loadStatus.loading) {
      setModelFlashbarItems([
        {
          type: "in-progress",
          loading: true,
          content: "Model loading...",
          dismissible: false,
        },
      ]);
    } else if (loadStatus.success) {
      setModelFlashbarItems([
        {
          type: "success",
          content: "Model loaded successfully",
          dismissible: true,
          onDismiss: clearModelFlashbar,
        },
      ]);

      // Auto-dismiss success message after 5 seconds
      const timer = setTimeout(clearModelFlashbar, 5000);
      return () => clearTimeout(timer);
    } else if (loadStatus.error) {
      setModelFlashbarItems([
        {
          type: "error",
          content: `Error loading model: ${loadStatus.error}`,
          dismissible: true,
          onDismiss: clearModelFlashbar,
        },
      ]);
    }
  }, [loadStatus, clearModelFlashbar, isAuthenticated]);

  // Prepare context value
  const contextValue: ModelsContextState = {
    modelOptions,
    selectedModel,
    isModelLoaded,
    isModelLoading,
    setSelectedModel,
    loadModel,
    reloadModels,
    loadStatus,
    modelFlashbarItems,
    clearModelFlashbar,
  };

  return contextValue;
};
