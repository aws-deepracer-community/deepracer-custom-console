import axios, { AxiosResponse } from "axios";

export abstract class ApiHelper {
  static async get<T>(path: string, timeoutMs?: number): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await axios.get("/api/" + path, {
        timeout: timeoutMs || 10000, // Default 10 seconds timeout, or custom timeout
      });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Unauthorized");
        // Only redirect if we're not already on the login page
        if (!window.location.hash.includes("/login")) {
          window.location.href = "/#/login";
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
        error.message === "Network Error"
      ) {
        console.log("Unable to connect to server");
        // Don't redirect to system-unavailable if we're on the software update page
        // or already on system-unavailable
        if (
          !window.location.hash.includes("/software-update") &&
          !window.location.hash.includes("/system-unavailable")
        ) {
          window.location.href = "/#/system-unavailable";
        }
        return null;
      }
      console.error("Error getting api " + path + ":", error);
      return null;
    }
  }

  static async post<T>(path: string, data: unknown): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await axios.post("/api/" + path, data, {
        timeout: 10000, // 10 seconds timeout
      });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log("Unauthorized");
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/#/login";
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
        error.message === "Network Error"
      ) {
        console.log("Unable to connect to server");
        // Don't redirect to system-unavailable if we're on the software update page
        // or already on system-unavailable
        if (
          !window.location.hash.includes("/software-update") &&
          !window.location.hash.includes("/system-unavailable")
        ) {
          window.location.href = "/#/system-unavailable";
        }
        return null;
      }
      console.error("Error posting to api " + path + ":", error);
      return null;
    }
  }
}
