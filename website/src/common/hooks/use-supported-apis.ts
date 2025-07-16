import { createContext, useContext, useEffect, useState } from "react";
import { ApiHelper } from "../helpers/api-helper";
import { useAuth } from "./use-authentication";

interface SupportedApisState {
  supportedApis: string[];
  isEmergencyStopSupported: boolean;
  isDeviceStatusSupported: boolean;
  isTimeApiSupported: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export const SupportedApisContext = createContext<SupportedApisState | null>(null);

export const useSupportedApis = () => {
  const context = useContext(SupportedApisContext);
  if (!context) {
    throw new Error("useSupportedApis must be used within a SupportedApisProvider");
  }
  return context;
};

export const useSupportedApisProvider = () => {
  const [supportedApis, setSupportedApis] = useState<string[]>([]);
  const [isEmergencyStopSupported, setIsEmergencyStopSupported] = useState<boolean>(false);
  const [isDeviceStatusSupported, setIsDeviceStatusSupported] = useState<boolean>(false);
  const [isTimeApiSupported, setIsTimeApiSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Don't fetch supported APIs if not authenticated
    if (!isAuthenticated) {
      setSupportedApis([]);
      setIsEmergencyStopSupported(false);
      setIsDeviceStatusSupported(false);
      setIsLoading(false);
      setIsTimeApiSupported(false);
      setHasError(false);
      return;
    }

    let isSubscribed = true;

    const checkSupportedApis = async () => {
      try {
        setIsLoading(true);
        const response = await ApiHelper.get<{ apis_supported: string[]; success: boolean }>(
          "supported_apis"
        );

        if (isSubscribed && response?.success) {
          setSupportedApis(response.apis_supported);
          setIsEmergencyStopSupported(response.apis_supported.includes("/api/emergency_stop"));
          setIsDeviceStatusSupported(response.apis_supported.includes("/api/get_device_status"));
          setIsTimeApiSupported(response.apis_supported.includes("/api/get_time"));
          setHasError(false);
        } else if (isSubscribed) {
          setSupportedApis([]);
          setIsEmergencyStopSupported(false);
          setIsDeviceStatusSupported(false);
          setIsTimeApiSupported(false);
          setHasError(true);
        }
      } catch (error) {
        console.error("Error checking supported APIs:", error);
        if (isSubscribed) {
          setSupportedApis([]);
          setIsEmergencyStopSupported(false);
          setIsDeviceStatusSupported(false);
          setIsTimeApiSupported(false);
          setHasError(true);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    checkSupportedApis();

    // We don't need to poll this frequently as supported APIs rarely change
    // Only check once at startup, or refresh manually if needed

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]); // Add isAuthenticated as a dependency

  const supportedApisContextValue: SupportedApisState = {
    supportedApis,
    isEmergencyStopSupported,
    isDeviceStatusSupported,
    isTimeApiSupported,
    isLoading,
    hasError,
  };

  return supportedApisContextValue;
};
