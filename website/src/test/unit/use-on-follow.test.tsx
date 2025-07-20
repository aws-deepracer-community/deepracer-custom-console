import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOnFollow } from "../../common/hooks/use-on-follow";

// Mock useNavigate from react-router
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Helper to create CustomEvent with FollowDetail
const createFollowEvent = (detail: { external?: boolean; href?: string }) => {
  const event = new CustomEvent("follow", { detail });
  // Add preventDefault method
  event.preventDefault = vi.fn();
  return event;
};

describe("useOnFollow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return a callback function", () => {
    const { result } = renderHook(() => useOnFollow());

    expect(typeof result.current).toBe("function");
  });

  it("should navigate to internal links", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: false,
      href: "/internal-page",
    });

    onFollow(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/internal-page");
  });

  it("should navigate when external is undefined and href is provided", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      href: "/another-page",
    });

    onFollow(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/another-page");
  });

  it("should not navigate when external is true", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: true,
      href: "https://external-site.com",
    });

    onFollow(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when href is undefined", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: false,
    });

    onFollow(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when href is undefined even if external is false", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: false,
      href: undefined,
    });

    onFollow(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should not navigate when both external is true and href is undefined", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: true,
      href: undefined,
    });

    onFollow(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle empty href string", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const event = createFollowEvent({
      external: false,
      href: "",
    });

    onFollow(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("");
  });

  it("should handle various internal routes", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const testRoutes = ["/", "/home", "/settings", "/models", "/calibration", "/settings/network"];

    testRoutes.forEach((route) => {
      const event = createFollowEvent({
        external: false,
        href: route,
      });

      onFollow(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith(route);

      // Reset mocks for next iteration
      vi.clearAllMocks();
    });
  });

  it("should maintain function reference stability", () => {
    const { result, rerender } = renderHook(() => useOnFollow());

    const initialCallback = result.current;

    // Trigger a re-render
    rerender();

    // The callback should be the same reference due to useCallback with stable navigate dependency
    expect(result.current).toBe(initialCallback);
  });

  it("should handle events with no detail object gracefully", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    // Create event with no detail (this would cause an error in real usage, but testing defensive behavior)
    const event = new CustomEvent("follow") as CustomEvent<{ external?: boolean; href?: string }>;
    event.preventDefault = vi.fn();

    // This would throw in real usage due to event.detail being undefined
    // But we can test that our logic handles the case where detail.external and detail.href are checked
    expect(() => onFollow(event)).toThrow();
  });

  it("should handle different external flag values", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    // Test external: false explicitly
    const internalEvent = createFollowEvent({
      external: false,
      href: "/internal",
    });

    onFollow(internalEvent);
    expect(mockNavigate).toHaveBeenCalledWith("/internal");

    vi.clearAllMocks();

    // Test external: true explicitly
    const externalEvent = createFollowEvent({
      external: true,
      href: "https://example.com",
    });

    onFollow(externalEvent);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should work with complex route paths", () => {
    const { result } = renderHook(() => useOnFollow());
    const onFollow = result.current;

    const complexRoutes = [
      "/settings/network/edit/123",
      "/models?filter=active",
      "/calibration#speed-adjustment",
      "/logs?page=2&limit=50",
    ];

    complexRoutes.forEach((route) => {
      const event = createFollowEvent({
        href: route,
      });

      onFollow(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith(route);

      vi.clearAllMocks();
    });
  });
});
