import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AxiosResponse, AxiosError } from "axios";
import { ApiHelper } from "../../common/helpers/api-helper";

// Mock axios with a factory function
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Get the mocked axios after the module is mocked
import axios from "axios";
const mockedAxios = vi.mocked(axios);

// Type the mocked functions properly
const mockGet = mockedAxios.get as ReturnType<typeof vi.fn>;
const mockPost = mockedAxios.post as ReturnType<typeof vi.fn>;

// Mock window.location
const mockLocation = {
  hash: "",
  href: "",
  pathname: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

Object.defineProperty(console, "log", {
  value: mockConsole.log,
});

Object.defineProperty(console, "error", {
  value: mockConsole.error,
});

describe("ApiHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.hash = "";
    mockLocation.href = "";
    mockLocation.pathname = "";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("get method", () => {
    it("should successfully return data from GET request", async () => {
      const mockData = { id: 1, name: "test" };
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} },
      } as AxiosResponse;

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await ApiHelper.get<typeof mockData>("test-path");

      expect(mockGet).toHaveBeenCalledWith("/api/test-path", {
        timeout: 10000,
      });
      expect(result).toEqual(mockData);
    });

    it("should use custom timeout when provided", async () => {
      const mockData = { id: 1 };
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      await ApiHelper.get<typeof mockData>("test-path", 5000);

      expect(mockGet).toHaveBeenCalledWith("/api/test-path", {
        timeout: 5000,
      });
    });

    it("should handle 401 unauthorized error and redirect to login", async () => {
      const mockError: AxiosError = {
        response: {
          status: 401,
          data: null,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 401",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/home";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unauthorized");
      expect(mockLocation.href).toBe("/#/login");
      expect(result).toBeNull();
    });

    it("should not redirect to login if already on login page", async () => {
      const mockError: AxiosError = {
        response: {
          status: 401,
          data: null,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 401",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/login";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unauthorized");
      expect(mockLocation.href).toBe("");
      expect(result).toBeNull();
    });

    it("should handle 500 server error and redirect to system unavailable", async () => {
      const mockError: AxiosError = {
        response: {
          status: 500,
          data: null,
          statusText: "Internal Server Error",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 500",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/home";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(mockLocation.href).toBe("/#/system-unavailable");
      expect(result).toBeNull();
    });

    it("should not redirect to system unavailable if on software update page", async () => {
      const mockError: AxiosError = {
        response: {
          status: 500,
          data: null,
          statusText: "Internal Server Error",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 500",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/software-update";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(mockLocation.href).toBe("");
      expect(result).toBeNull();
    });

    it("should not redirect to system unavailable if already on system unavailable page", async () => {
      const mockError: AxiosError = {
        response: {
          status: 500,
          data: null,
          statusText: "Internal Server Error",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 500",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/system-unavailable";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(mockLocation.href).toBe("");
      expect(result).toBeNull();
    });

    it("should handle connection refused error", async () => {
      const mockError: AxiosError = {
        code: "ERR_CONNECTION_REFUSED",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "connect ECONNREFUSED",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/home";

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(mockLocation.href).toBe("/#/system-unavailable");
      expect(result).toBeNull();
    });

    it("should handle connection timeout error", async () => {
      const mockError: AxiosError = {
        code: "ERR_CONNECTION_TIMED_OUT",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "timeout of 10000ms exceeded",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle ECONNABORTED error", async () => {
      const mockError: AxiosError = {
        code: "ECONNABORTED",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "timeout of 10000ms exceeded",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle ERR_NETWORK error", async () => {
      const mockError: AxiosError = {
        code: "ERR_NETWORK",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "Network Error",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle timeout message error", async () => {
      const mockError: AxiosError = {
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "Request timeout occurred",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle Network Error message", async () => {
      const mockError: AxiosError = {
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "Network Error",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle other client errors (4xx) without redirect", async () => {
      const mockError: AxiosError = {
        response: {
          status: 404,
          data: null,
          statusText: "Not Found",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 404",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.error).toHaveBeenCalledWith("Error getting api test-path:", mockError);
      expect(mockLocation.href).toBe("");
      expect(result).toBeNull();
    });

    it("should handle generic errors", async () => {
      const mockError = new Error("Generic error");

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.error).toHaveBeenCalledWith("Error getting api test-path:", mockError);
      expect(result).toBeNull();
    });
  });

  describe("post method", () => {
    it("should successfully return data from POST request", async () => {
      const mockData = { id: 1, name: "test" };
      const postData = { name: "new item" };
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await ApiHelper.post<typeof mockData>("test-path", postData);

      expect(mockPost).toHaveBeenCalledWith("/api/test-path", postData, {
        timeout: 10000,
      });
      expect(result).toEqual(mockData);
    });

    it("should handle 401 unauthorized error and redirect to login", async () => {
      const mockError: AxiosError = {
        response: {
          status: 401,
          data: null,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 401",
        toJSON: () => ({}),
      };

      mockPost.mockRejectedValueOnce(mockError);
      mockLocation.pathname = "/home";

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.log).toHaveBeenCalledWith("Unauthorized");
      expect(mockLocation.href).toBe("/#/login");
      expect(result).toBeNull();
    });

    it("should not redirect to login if already on login page (pathname check)", async () => {
      const mockError: AxiosError = {
        response: {
          status: 401,
          data: null,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 401",
        toJSON: () => ({}),
      };

      mockPost.mockRejectedValueOnce(mockError);
      mockLocation.pathname = "/login";

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.log).toHaveBeenCalledWith("Unauthorized");
      expect(mockLocation.href).toBe("");
      expect(result).toBeNull();
    });

    it("should handle 500 server error and redirect to system unavailable", async () => {
      const mockError: AxiosError = {
        response: {
          status: 500,
          data: null,
          statusText: "Internal Server Error",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 500",
        toJSON: () => ({}),
      };

      mockPost.mockRejectedValueOnce(mockError);
      mockLocation.hash = "#/home";

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(mockLocation.href).toBe("/#/system-unavailable");
      expect(result).toBeNull();
    });

    it("should handle connection errors", async () => {
      const mockError: AxiosError = {
        code: "ERR_CONNECTION_REFUSED",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "connect ECONNREFUSED",
        toJSON: () => ({}),
      };

      mockPost.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle other errors", async () => {
      const mockError: AxiosError = {
        response: {
          status: 400,
          data: null,
          statusText: "Bad Request",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 400",
        toJSON: () => ({}),
      };

      mockPost.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.error).toHaveBeenCalledWith("Error posting to api test-path:", mockError);
      expect(result).toBeNull();
    });

    it("should handle generic errors", async () => {
      const mockError = new Error("Generic error");

      mockPost.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.post("test-path", {});

      expect(mockConsole.error).toHaveBeenCalledWith("Error posting to api test-path:", mockError);
      expect(result).toBeNull();
    });
  });

  describe("error handling edge cases", () => {
    it("should handle 5xx server errors range (502, 503, etc.)", async () => {
      const mockError: AxiosError = {
        response: {
          status: 502,
          data: null,
          statusText: "Bad Gateway",
          headers: {},
          config: { headers: {} } as AxiosResponse["config"],
        },
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed with status code 502",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle ERR_CONNECTION_RESET error", async () => {
      const mockError: AxiosError = {
        code: "ERR_CONNECTION_RESET",
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "socket hang up",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.log).toHaveBeenCalledWith("Unable to connect to server");
      expect(result).toBeNull();
    });

    it("should handle null response object", async () => {
      const mockError: AxiosError = {
        response: undefined,
        isAxiosError: true,
        name: "AxiosError",
        message: "Request failed",
        toJSON: () => ({}),
      };

      mockGet.mockRejectedValueOnce(mockError);

      const result = await ApiHelper.get("test-path");

      expect(mockConsole.error).toHaveBeenCalledWith("Error getting api test-path:", mockError);
      expect(result).toBeNull();
    });
  });
});
