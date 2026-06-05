import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, render } from "../utils";
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

  // Spy on setInterval/clearInterval so we can trigger polls manually
  // without any fake-timer infrastructure that conflicts with React 18.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeCallback: (() => Promise<void>) | null = null;
  let activeIntervalId: number = 0;
  let idCounter = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setIntervalSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clearIntervalSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockApiHelperGet.mockClear();
    activeCallback = null;
    idCounter = 1000;

    setIntervalSpy = vi
      .spyOn(globalThis, "setInterval")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((callback: any) => {
        const id = idCounter++;
        activeCallback = callback as () => Promise<void>;
        activeIntervalId = id;
        return id as unknown as ReturnType<typeof setInterval>;
      });

    clearIntervalSpy = vi
      .spyOn(globalThis, "clearInterval")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((id: any) => {
        if ((id as number) === activeIntervalId) {
          activeCallback = null;
        }
      });
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    activeCallback = null;
  });

  /**
   * Trigger one poll cycle and wait for the async callback to settle.
   * Is a no-op if the interval has been cleared (component unmounted).
   */
  const triggerPoll = async () => {
    if (activeCallback) {
      await activeCallback();
    }
  };

  it("should render system unavailable message with all required elements and layout", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    // Check for AWS logo
    const logo = screen.getByAltText("AWS Logo");
    expect(logo).toBeInTheDocument();
    expect(logo.getAttribute("src")).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(logo).toHaveAttribute("width", "100");

    // Check for main heading
    expect(
      screen.getByText("The DeepRacer system is currently unavailable")
    ).toBeInTheDocument();

    // Check for instruction text
    expect(
      screen.getByText(/If the problem persists try rebooting your DeepRacer car/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/If rebooting doesn't fix the problem consider flashing your car/)
    ).toBeInTheDocument();

    // Check layout structure
    const wrapper = createWrapper(document.body);
    expect(wrapper.findBox()).toBeTruthy();
    expect(wrapper.findGrid()).toBeTruthy();
    expect(wrapper.findContainer()).toBeTruthy();
    expect(wrapper.findSpaceBetween()).toBeTruthy();
  });

  it("should start polling server on component mount", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    await triggerPoll();

    // Should call server_ready endpoint at first poll
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    expect(mockApiHelperGet).toHaveBeenCalledTimes(1);
  });

  it("should continue polling when server is unavailable", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    render(<SystemUnavailablePage />);

    await triggerPoll();
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    const firstPollCallCount = mockApiHelperGet.mock.calls.length;
    expect(firstPollCallCount).toBeGreaterThan(0);

    await triggerPoll();
    expect(mockApiHelperGet.mock.calls.length).toBeGreaterThan(firstPollCallCount);
  });

  it("should navigate to home when server becomes available", async () => {
    mockApiHelperGet.mockResolvedValue({ status: "ready" });

    render(<SystemUnavailablePage />);

    await triggerPoll();

    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should not navigate when API returns falsy response", async () => {
    mockApiHelperGet.mockResolvedValue(null);

    render(<SystemUnavailablePage />);

    await triggerPoll();

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

      await triggerPoll();

      expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");
      expect(mockNavigate).not.toHaveBeenCalled();

      unmount();
    }
  });

  it("should clean up polling interval on component unmount", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    const { unmount } = render(<SystemUnavailablePage />);

    await triggerPoll();
    const callsBeforeUnmount = mockApiHelperGet.mock.calls.length;

    // Unmount clears the interval — subsequent triggerPoll calls are no-ops
    unmount();

    await triggerPoll();
    await triggerPoll();

    expect(mockApiHelperGet).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it("should handle server becoming available after failures", async () => {
    mockApiHelperGet
      .mockRejectedValueOnce(new Error("Server down"))
      .mockResolvedValueOnce({ status: "ready" });

    render(<SystemUnavailablePage />);

    await triggerPoll();
    expect(mockNavigate).not.toHaveBeenCalled();

    await triggerPoll();
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should handle mixed response scenarios correctly", async () => {
    mockApiHelperGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "ready" });

    render(<SystemUnavailablePage />);

    await triggerPoll();
    expect(mockNavigate).not.toHaveBeenCalled();

    await triggerPoll();
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
  });

  it("should handle rapid mount/unmount without errors", async () => {
    mockApiHelperGet.mockRejectedValue(new Error("Server unavailable"));

    // Mount and immediately unmount — interval cleared immediately
    const { unmount: unmount1 } = render(<SystemUnavailablePage />);
    unmount1();

    // Second mount re-registers the interval
    const { unmount: unmount2 } = render(<SystemUnavailablePage />);

    await triggerPoll();
    expect(mockApiHelperGet).toHaveBeenCalledWith("server_ready");

    unmount2();

    const callsBeforeFinalUnmount = mockApiHelperGet.mock.calls.length;

    // Polling should be stopped — triggerPoll is now a no-op
    await triggerPoll();
    await triggerPoll();

    expect(mockApiHelperGet).toHaveBeenCalledTimes(callsBeforeFinalUnmount);
  });
});
