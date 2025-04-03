import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

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

  // Network status management
  useEffect(() => {
    let isSubscribed = true;

    const getNetworkStatus = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/get_network_details");
        if (response.data?.success && isSubscribed) {
          setSsid(response.data.SSID);
          setIpAddresses(response.data.ip_address.split(",").map((ip: string) => ip.trim()));
          setHasError(false);
        } else if (isSubscribed) {
          setSsid("");
          setIpAddresses([]);
          setHasError(true);
        }
      } catch (error) {
        console.error("Error fetching network status:", error);
        if (isSubscribed) {
          setSsid("");
          setIpAddresses([]);
          setHasError(true);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    getNetworkStatus();
    const networkInterval = setInterval(getNetworkStatus, 10000);

    return () => {
      isSubscribed = false;
      clearInterval(networkInterval);
    };
  }, []);

  const networkContextValue: NetworkState = {
    ssid,
    ipAddresses,
    isLoading,
    hasError,
  };

  return networkContextValue;
};
