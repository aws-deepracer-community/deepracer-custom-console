import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./use-authentication";

// Constants
const NETWORK_INTERVAL_MS = 55000;

// Network Context
interface NetworkState {
  ssid: string;
  ipAddresses: string[];
  isLoading: boolean;
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
  const { isAuthenticated } = useAuth();

  // Network status management
  useEffect(() => {
    // Don't fetch network details if not authenticated
    if (!isAuthenticated) {
      setSsid("");
      setIpAddresses([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isSubscribed = true;

    const getNetworkStatus = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/get_network_details");
        if (response.data?.success && isSubscribed) {
          console.debug(
            `Success! SSID: ${response.data.SSID}, IP Address: ${response.data.ip_address}`
          );
          setSsid(response.data.SSID);
          setIpAddresses(response.data.ip_address.split(",").map((ip: string) => ip.trim()));
          setHasError(false);
        } else if (isSubscribed) {
          console.debug("Network data success flag is false or missing", response.data);
          setSsid("");
          setIpAddresses([]);
          setHasError(true);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Axios error fetching network status:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });
        } else {
          console.error("Unknown error fetching network status:", error);
        }

        if (isSubscribed) {
          console.debug("Setting network error state due to exception");
          setSsid("");
          setIpAddresses([]);
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
    getNetworkStatus();
    const networkInterval = setInterval(getNetworkStatus, NETWORK_INTERVAL_MS);
    console.debug(`Network monitoring interval set: ${NETWORK_INTERVAL_MS}ms`);

    return () => {
      console.debug("Cleaning up network monitoring");
      isSubscribed = false;
      clearInterval(networkInterval);
    };
  }, [isAuthenticated]); // Add isAuthenticated as a dependency

  const networkContextValue: NetworkState = {
    ssid,
    ipAddresses,
    isLoading,
    hasError,
  };

  return networkContextValue;
};
