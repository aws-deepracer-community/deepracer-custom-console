import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { useCamera } from "../../../common/hooks/use-camera";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("useCamera", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch parameters on mount and set loading to false", async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "success",
        params: [
          { name: "ExposureTime", type: "integer", value: 1000 },
          { name: "AeEnable", type: "boolean", value: true },
        ],
      },
    });

    const { result } = renderHook(() => useCamera());

    // Check initial loading state
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.parameters).toHaveLength(2);
    expect(result.current.parameters[0].name).toBe("ExposureTime");
    expect(result.current.error).toBeNull();
  });

  it("should handle error when fetching parameters fails", async () => {
    (axios.get as any).mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useCamera());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Unexpected API response format.");
  });

  it("should handle API error response (status: error)", async () => {
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "error",
        message: "Failed to fetch parameters from server",
      },
    });

    const { result } = renderHook(() => useCamera());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to fetch parameters from server");
  });

  it("should set a parameter and refresh", async () => {
    // 1. Mock initial fetch (GET)
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "success",
        params: [{ name: "ExposureTime", type: "integer", value: 1000 }],
      },
    });

    // 2. Mock the set parameter call (POST)
    (axios.post as any).mockResolvedValueOnce({
      data: { status: "success" },
    });

    // 3. Mock the subsequent re-fetch after successful update (GET)
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "success",
        params: [{ name: "ExposureTime", type: "integer", value: 2000 }],
      },
    });

    const { result } = renderHook(() => useCamera());

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.parameters[0].value).toBe(1000);

    // Call setParameter
    const setPromise = result.current.setParameter("ExposureTime", 2000);
    expect(setPromise).resolves.toEqual({ success: true });

    // Wait for re-fetch to complete (it's called inside setParameter)
    await waitFor(() => expect(result.current.parameters[0].value).toBe(2000));
  });

  it("should handle error when setting parameter fails", async () => {
    // 1. Mock initial fetch
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "success",
        params: [{ name: "ExposureTime", type: "integer", value: 1000 }],
      },
    });

    // 2. Mock failed set parameter (POST)
    (axios.post as any).mockResolvedValueOnce({
      data: { status: "error", message: "Invalid value" },
    });

    // 3. Mock re-fetch after failure
    (axios.get as any).mockResolvedValueOnce({
      data: {
        status: "success",
        params: [{ name: "ExposureTime", type: "integer", value: 1000 }],
      },
    });

    const { result } = renderHook(() => useCamera());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const setPromise = result.current.setParameter("ExposureTime", 500);
    expect(setPromise).resolves.toEqual({ success: false, message: "Invalid value" });
  });
});
