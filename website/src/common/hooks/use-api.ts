import axios, { AxiosResponse } from "axios";
import { createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Define the API Context type
interface ApiContextType {
  get: <T>(path: string) => Promise<T | null>;
  post: <T>(path: string, data: unknown) => Promise<T | null>;
}

// Create and export the context
export const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Custom hook to use the API context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

// Hook to provide API context values
export const useApiProvider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const DEFAULT_TIMEOUT = 10000; // 10 seconds

  const get = async <T>(path: string): Promise<T | null> => {
    try {
      const response: AxiosResponse<T> = await axios.get("/api/" + path, {
        timeout: DEFAULT_TIMEOUT,
      });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Unauthorized");
        // Only redirect if we're not already on the login page
        if (!location.pathname.includes("/login")) {
          navigate("/login");
        }
        return null;
      }
      if (
        (error.response?.status >= 500 && error.response?.status < 600) ||
        error.code === "ERR_CONNECTION_REFUSED" ||
        error.code === "ERR_CONNECTION_TIMED_OUT" ||
        error.code === "ERR_CONNECTION_RESET" ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        error.message?.includes("timeout") ||
        error.message === "Network Error" ||
        (error.request && error.request.status === 0)
      ) {
        console.log("Unable to connect to server", {
          code: error.code,
          message: error.message,
          status: error.request?.status,
        });
        // Don't redirect to system-unavailable if we're on the software update page
        // or already on system-unavailable
        if (
          !location.pathname.includes("/software-update") &&
          !location.pathname.includes("/system-unavailable")
        ) {
          navigate("/system-unavailable");
        }
        return null;
      }
      console.error("Error getting api " + path + ":", error);
      return null;
    }
  };

  const post = async <T>(path: string, data: unknown): Promise<T | null> => {
    try {
      const response: AxiosResponse<T> = await axios.post("/api/" + path, data, {
        timeout: DEFAULT_TIMEOUT,
      });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Unauthorized");
        // Only redirect if we're not already on the login page
        if (!location.pathname.includes("/login")) {
          navigate("/login");
        }
        return null;
      }
      if (
        (error.response?.status >= 500 && error.response?.status < 600) ||
        error.code === "ERR_CONNECTION_REFUSED" ||
        error.code === "ERR_CONNECTION_TIMED_OUT" ||
        error.code === "ERR_CONNECTION_RESET" ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        error.message?.includes("timeout") ||
        error.message === "Network Error" ||
        (error.request && error.request.status === 0)
      ) {
        console.log("Unable to connect to server", {
          code: error.code,
          message: error.message,
          status: error.request?.status,
        });
        // Don't redirect to system-unavailable if we're on the software update page
        // or already on system-unavailable
        if (
          !location.pathname.includes("/software-update") &&
          !location.pathname.includes("/system-unavailable")
        ) {
          navigate("/system-unavailable");
        }
        return null;
      }
      console.error("Error posting to api " + path + ":", error);
      return null;
    }
  };

  return { get, post };
};
