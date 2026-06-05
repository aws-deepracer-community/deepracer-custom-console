import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiHelper } from "../helpers/api-helper";
import { useAuth } from "./use-authentication";
import { useSupportedApis } from "./use-supported-apis";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface CarConfig {
  logging: {
    mode: string;
    provider: string;
  };
  camera: {
    mode: string;
    enable_gray_overlay?: boolean;
  };
  inference: {
    engine: string;
    device: string;
  };
  steering: {
    mode: string;
  };
}

export interface Capabilities {
  camera_modes: string[];
  logging_modes: string[];
  logging_providers: string[];
  inference_engines: string[];
  inference_devices: Record<string, string[]>;
  steering_modes: string[];
  gray_overlay?: boolean;
}

export interface CarConfigResponse {
  success: boolean;
  config: CarConfig;
  capabilities?: Capabilities;
  reason?: string;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface CarConfigState {
  config: CarConfig | null;
  capabilities: Capabilities | null;
  isGrayOverlaySupported: boolean;
  isGrayOverlayEnabled: boolean;
  isLoading: boolean;
  refresh: () => void;
}

export const CarConfigContext = createContext<CarConfigState | null>(null);

export const useCarConfig = () => {
  const context = useContext(CarConfigContext);
  if (!context) {
    throw new Error("useCarConfig must be used within CarConfigContext.Provider");
  }
  return context;
};

export const useCarConfigProvider = () => {
  const [config, setConfig] = useState<CarConfig | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const { isAuthenticated } = useAuth();
  const { isCarConfigSupported } = useSupportedApis();

  const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  useEffect(() => {
    if (!isAuthenticated || !isCarConfigSupported) {
      setConfig(null);
      setCapabilities(null);
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;

    const fetchCarConfig = async () => {
      setIsLoading(true);
      try {
        const data = await ApiHelper.get<CarConfigResponse>("car_config");
        if (!isSubscribed) return;
        if (data?.success) {
          setConfig(data.config);
          setCapabilities(data.capabilities ?? null);
        } else {
          setConfig(null);
          setCapabilities(null);
        }
      } catch {
        if (isSubscribed) {
          setConfig(null);
          setCapabilities(null);
        }
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    fetchCarConfig();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, isCarConfigSupported, refreshTick]);

  const isGrayOverlaySupported = capabilities?.gray_overlay === true;
  const isGrayOverlayEnabled = config?.camera?.enable_gray_overlay === true;

  return { config, capabilities, isGrayOverlaySupported, isGrayOverlayEnabled, isLoading, refresh };
};
