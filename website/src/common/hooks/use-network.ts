import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./use-authentication";
import { useApi } from "./use-api";

// Constants
const NETWORK_INTERVAL_MS = 55000;

// Types
interface NetworkDetailsResponse {
  success: boolean;
  SSID: string;
  ip_address: string;
  is_usb_connected: boolean;
}

// Network Context
interface NetworkState {
  ssid: string;
  ipAddresses: string[];
  isLoading: boolean;
  isUSBConnected: boolean;
  hasError: boolean;
}

export const NetworkContext = createContext<NetworkState | null>(null);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

export const useNetworkProvider = () => {
  const [ssid, setSsid] = useState<string>("");
  const [ipAddresses, setIpAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [hasInitialReading, setHasInitialReading] = useState<boolean>(false);
  const [isUSBConnected, setIsUSBConnected] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const { get } = useApi();

  // Network status management
  useEffect(() => {
    // Don't fetch network details if not authenticated
    if (!isAuthenticated) {
      setSsid("");
      setIpAddresses([]);
      setIsLoading(false);
      setHasError(false);
      setIsUSBConnected(false);
      return;
    }

    let isSubscribed = true;

    const getNetworkStatus = async () => {
      try {
        setIsLoading(true);
        const response = await get<NetworkDetailsResponse>("get_network_details");
        if (response?.success && isSubscribed) {
          if (!hasInitialReading) setHasInitialReading(true);
          console.debug(`Success! SSID: ${response.SSID}, IP Address: ${response.ip_address}`);
          setSsid(response.SSID);
          setIpAddresses(response.ip_address.split(",").map((ip: string) => ip.trim()));
          setIsUSBConnected(response.is_usb_connected);
          setHasError(false);
        } else if (isSubscribed) {
          console.debug("Network data success flag is false or missing", response);
          setSsid("");
          setIpAddresses([]);
          setIsUSBConnected(false);
          setHasError(true);
        }
      } catch (error) {
        console.error("Error fetching network status:", error);

        if (isSubscribed) {
          console.debug("Setting network error state due to exception");
          setSsid("");
          setIpAddresses([]);
          setIsUSBConnected(false);
          setHasError(true);
        }
      } finally {
        if (isSubscribed) {
          console.debug("Network status update completed, setting isLoading to false");
          setIsLoading(false);
        }
      }
    };

    console.debug("Initializing network monitoring");
    if (!hasInitialReading) {
      getNetworkStatus();
    }
    const networkInterval = setInterval(getNetworkStatus, NETWORK_INTERVAL_MS);
    console.debug(`Network monitoring interval set: ${NETWORK_INTERVAL_MS}ms`);

    return () => {
      console.debug("Cleaning up network monitoring");
      isSubscribed = false;
      clearInterval(networkInterval);
    };
  }, [isAuthenticated, get, hasInitialReading]);

  const networkContextValue: NetworkState = {
    ssid,
    ipAddresses,
    isLoading,
    isUSBConnected,
    hasError,
  };

  return networkContextValue;
};
