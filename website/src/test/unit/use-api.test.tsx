import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import axios from "axios";
import { useApi, useApiProvider, ApiContext } from "../../common/hooks/use-api";
import { ReactNode } from "react";

interface MockApi {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
}

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/home" };

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Test wrapper component for ApiContext
const createWrapper = (apiValue: MockApi) => {
  return ({ children }: { children: ReactNode }) => (
    <ApiContext.Provider value={apiValue}>{children}</ApiContext.Provider>
  );
};

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw error when used outside of ApiProvider", () => {
    // Expect the hook to throw an error when used outside of ApiProvider
    expect(() => {
      renderHook(() => useApi());
    }).toThrow("useApi must be used within an ApiProvider");
  });

  it("should return context value when used within ApiProvider", () => {
    const mockApi = {
      get: vi.fn(),
      post: vi.fn(),
    };

    const wrapper = createWrapper(mockApi);
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current).toBe(mockApi);
    expect(result.current.get).toBe(mockApi.get);
    expect(result.current.post).toBe(mockApi.post);
  });
});

describe("useApiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/home";
  });

  describe("get method", () => {
    it("should make successful GET request", async () => {
      const mockData = { success: true, data: "test" };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(axiosGet).toHaveBeenCalledWith("/api/test-endpoint", {
        timeout: 10000,
      });
      expect(response).toEqual(mockData);
    });

    it("should handle 401 unauthorized error and navigate to login", async () => {
      const error = {
        response: { status: 401 },
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("should not navigate to login if already on login page", async () => {
      mockLocation.pathname = "/login";
      const error = {
        response: { status: 401 },
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle 500 server error and navigate to system-unavailable", async () => {
      const error = {
        response: { status: 500 },
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle connection refused error", async () => {
      const error = {
        code: "ERR_CONNECTION_REFUSED",
        message: "Connection refused",
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle timeout error", async () => {
      const error = {
        code: "ECONNABORTED",
        message: "timeout of 10000ms exceeded",
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle network error", async () => {
      const error = {
        code: "ERR_NETWORK",
        message: "Network Error",
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should not navigate to system-unavailable from software-update page", async () => {
      mockLocation.pathname = "/software-update";
      const error = {
        response: { status: 500 },
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("post method", () => {
    it("should make successful POST request", async () => {
      const mockData = { success: true, id: 123 };
      const postData = { name: "test", value: "data" };
      const axiosPost = vi.mocked(axios.post);
      axiosPost.mockResolvedValueOnce({ data: mockData });

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.post("test-endpoint", postData);

      expect(axiosPost).toHaveBeenCalledWith("/api/test-endpoint", postData, {
        timeout: 10000,
      });
      expect(response).toEqual(mockData);
    });

    it("should handle 401 unauthorized error in POST and navigate to login", async () => {
      const error = {
        response: { status: 401 },
      };
      const axiosPost = vi.mocked(axios.post);
      axiosPost.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.post("test-endpoint", {});

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("should handle server errors in POST and navigate to system-unavailable", async () => {
      const error = {
        response: { status: 503 },
      };
      const axiosPost = vi.mocked(axios.post);
      axiosPost.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.post("test-endpoint", {});

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle connection timeout in POST", async () => {
      const error = {
        code: "ERR_CONNECTION_TIMED_OUT",
        message: "Connection timed out",
      };
      const axiosPost = vi.mocked(axios.post);
      axiosPost.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.post("test-endpoint", {});

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });
  });

  describe("error handling edge cases", () => {
    it("should handle errors with timeout message", async () => {
      const error = {
        message: "Request timeout exceeded",
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle ERR_CONNECTION_RESET error", async () => {
      const error = {
        code: "ERR_CONNECTION_RESET",
      };
      const axiosGet = vi.mocked(axios.get);
      axiosGet.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.get("test-endpoint");

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });

    it("should handle request with status 0", async () => {
      const error = {
        request: { status: 0 },
        message: "Request failed",
      };
      const axiosPost = vi.mocked(axios.post);
      axiosPost.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useApiProvider());
      const response = await result.current.post("test-endpoint", {});

      expect(response).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });
  });
});
