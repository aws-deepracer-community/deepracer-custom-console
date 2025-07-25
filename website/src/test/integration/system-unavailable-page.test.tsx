import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  screen,
  render,
  act,
} from "../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import SystemUnavailablePage from "../../pages/system-unavailable";
import { ApiHelper } from "../../common/helpers/api-helper";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ApiHelper
vi.mock("../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
  },
}));

describe("SystemUnavailablePage Integration", () => {
  const mockApiHelperGet = vi.mocked(ApiHelper.get);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockNavigate.mockClear();
    mockApiHelperGet.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should render system unavailable message with all required elements and layout", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    // Check for AWS logo
    const logo = screen.getByAltText("AWS Logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "./static/AWS_logo_RGB.svg");
    expect(logo).toHaveAttribute("width", "100");

    // Check for main heading
    expect(screen.getByText("The DeepRacer system is currently unavailable")).toBeInTheDocument();

    // Check for instruction text
    expect(screen.getByText(/If the problem persists try rebooting your DeepRacer car/)).toBeInTheDocument();
    expect(screen.getByText(/If rebooting doesn't fix the problem consider flashing your car/)).toBeInTheDocument();

    // Check layout structure
    const wrapper = createWrapper(document.body);
    
    // Check for Box with padding
    const outerBox = wrapper.findBox();
    expect(outerBox).toBeTruthy();

    // Check for Grid
    const grid = wrapper.findGrid();
    expect(grid).toBeTruthy();

    // Check for Container
    const container = wrapper.findContainer();
    expect(container).toBeTruthy();

    // Check for SpaceBetween layout
    const spaceBetween = wrapper.findSpaceBetween();
    expect(spaceBetween).toBeTruthy();
  });

  it("should start polling server on component mount", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    // Wait for initial effect to run
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Should call server_ready endpoint initially
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    expect(mockApiHelperGet).toHaveBeenCalledTimes(1);
  });

  it("should continue polling when server is unavailable", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    // Wait for initial mount and render
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    
    // Clear calls after initial setup
    mockApiHelperGet.mockClear();

    // Advance time by 5 seconds - should trigger polling
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await vi.runOnlyPendingTimersAsync();
    });
    
    // Should have made at least one polling call
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    const firstPollCallCount = mockApiHelperGet.mock.calls.length;
    expect(firstPollCallCount).toBeGreaterThan(0);
    
    // Advance time by another 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await vi.runOnlyPendingTimersAsync();
    });
    
    // Should have made more calls
    expect(mockApiHelperGet.mock.calls.length).toBeGreaterThan(firstPollCallCount);
  });

  it("should navigate to home when server becomes available", async () => {
    mockApiHelperGet.mockResolvedValue({ status: "ready" });

    render(<SystemUnavailablePage />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should not navigate when API returns falsy response", async () => {
    mockApiHelperGet.mockResolvedValue(null);

    render(<SystemUnavailablePage />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    const errors = [
      new Error("Network Error"),
      new Error("timeout"),
      { response: { status: 500 } },
      { code: "ERR_CONNECTION_REFUSED" },
    ];

    for (const error of errors) {
      mockApiHelperGet.mockClear();
      mockNavigate.mockClear();
      mockApiHelperGet.mockRejectedValue(error);

      const { unmount } = render(<SystemUnavailablePage />);

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
      expect(mockNavigate).not.toHaveBeenCalled();

      unmount();
    }
  });

  it("should clean up polling interval on component unmount", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    const { unmount } = render(<SystemUnavailablePage />);

    // Initial call
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    
    const callsBeforeUnmount = mockApiHelperGet.mock.calls.length;

    // Unmount component
    unmount();

    // Advance time - should not make more API calls after unmount
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await vi.runOnlyPendingTimersAsync();
    });

    // Should not have made additional calls after unmount
    expect(mockApiHelperGet).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it("should handle server becoming available after failures", async () => {
    // First call fails, second succeeds
    mockApiHelperGet
      .mockRejectedValueOnce(new Error("Server down"))
      .mockResolvedValueOnce({ status: "ready" });

    render(<SystemUnavailablePage />);

    // Initial call fails
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    // Second call after 5 seconds succeeds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should handle mixed response scenarios correctly", async () => {
    // Scenario: null response (should continue), then success
    mockApiHelperGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "ready" });

    render(<SystemUnavailablePage />);

    // First call returns null
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    // Second call succeeds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should handle rapid mount/unmount without errors", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    // Mount and immediately unmount
    const { unmount: unmount1 } = render(<SystemUnavailablePage />);
    unmount1();

    // Mount again
    const { unmount: unmount2 } = render(<SystemUnavailablePage />);
    
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Should have made at least one call from the second mount
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");

    unmount2();

    // Should not continue polling after final unmount
    const callsBeforeFinalUnmount = mockApiHelperGet.mock.calls.length;
    
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockApiHelperGet).toHaveBeenCalledTimes(callsBeforeFinalUnmount);
  });
});
