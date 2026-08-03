import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, act } from "../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import SettingsPage from "../../pages/settings";

// Mock useSupportedApis hook
const mockUseSupportedApis = vi.fn();
vi.mock("../../common/hooks/use-supported-apis", () => ({
  useSupportedApis: () => mockUseSupportedApis(),
  SupportedApisContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: unknown) => React.ReactNode }) => children({}),
  },
}));

// Mock BaseAppLayout to avoid complex layout dependencies
vi.mock("../../components/base-app-layout", () => ({
  default: ({ content }: { content: React.ReactNode }) => (
    <div data-testid="base-app-layout">
      <div data-testid="content">{content}</div>
    </div>
  ),
}));

// Mock all settings containers to avoid testing their internal logic
vi.mock("../../components/settings", () => ({
  NetworkSettingsContainer: () => <div data-testid="network-settings">Network Settings</div>,
  DeviceConsolePasswordContainer: () => (
    <div data-testid="console-password-settings">Console Password Settings</div>
  ),
  DeviceSshContainer: () => <div data-testid="ssh-settings">SSH Settings</div>,
  TimeContainer: () => <div data-testid="time-settings">Time Settings</div>,
  LedColorContainer: () => <div data-testid="led-color-settings">LED Color Settings</div>,
  AboutContainer: () => <div data-testid="about-settings">About Settings</div>,
  CarConfigContainer: () => <div data-testid="car-config-settings">Car Config Settings</div>,
  CameraSettingsContainer: () => <div data-testid="camera-settings">Camera Settings</div>,
}));

describe("SettingsPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render settings page with basic structure", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    // Verify the mocked BaseAppLayout is rendered
    expect(screen.getByTestId("base-app-layout")).toBeInTheDocument();

    // Verify main header and description
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Adjust your DeepRacer car settings")).toBeInTheDocument();
  });

  it("should have proper layout structure using Cloudscape components", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    const { container } = render(<SettingsPage />);
    const wrapper = createWrapper(container);

    expect(wrapper.findSpaceBetween()).toBeTruthy();
    expect(wrapper.findTextContent()).toBeTruthy();

    const header = wrapper.findHeader();
    expect(header).toBeTruthy();
    expect(header?.getElement()).toHaveTextContent("Settings");
  });

  it("should call useSupportedApis hook correctly", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    expect(mockUseSupportedApis).toHaveBeenCalled();
  });

  it("should be wrapped in BaseAppLayout component", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    expect(screen.getByTestId("base-app-layout")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("should render all settings containers when all APIs are supported", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    // About + System tab (default active) containers are immediately visible
    expect(screen.getByTestId("about-settings")).toBeInTheDocument();
    expect(screen.getByTestId("network-settings")).toBeInTheDocument();
    expect(screen.getByTestId("console-password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("ssh-settings")).toBeInTheDocument();
    expect(screen.getByTestId("time-settings")).toBeInTheDocument();

    // Switch to Car Configuration tab to see those containers
    const wrapper = createWrapper(document.body);
    act(() => {
      wrapper.findTabs()?.findTabLinkById("car-config")?.click();
    });

    expect(screen.getByTestId("led-color-settings")).toBeInTheDocument();
    expect(screen.getByTestId("car-config-settings")).toBeInTheDocument();
  });

  it("should not render TimeContainer when isTimeApiSupported is false", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: false,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    // TimeContainer is absent from the System tab
    expect(screen.queryByTestId("time-settings")).not.toBeInTheDocument();

    // Other System tab + About containers are present
    expect(screen.getByTestId("about-settings")).toBeInTheDocument();
    expect(screen.getByTestId("network-settings")).toBeInTheDocument();
    expect(screen.getByTestId("console-password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("ssh-settings")).toBeInTheDocument();

    // Switch to Car Configuration tab
    const wrapper = createWrapper(document.body);
    act(() => {
      wrapper.findTabs()?.findTabLinkById("car-config")?.click();
    });

    expect(screen.getByTestId("led-color-settings")).toBeInTheDocument();
    expect(screen.getByTestId("car-config-settings")).toBeInTheDocument();
  });

  it("should not render CarConfigContainer when isCarConfigSupported is false", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: false,
      isCameraApiSupported: true,
    });

    render(<SettingsPage />);

    // About + System tab containers are present
    expect(screen.getByTestId("about-settings")).toBeInTheDocument();
    expect(screen.getByTestId("network-settings")).toBeInTheDocument();
    expect(screen.getByTestId("console-password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("ssh-settings")).toBeInTheDocument();
    expect(screen.getByTestId("time-settings")).toBeInTheDocument();

    // Switch to Car Configuration tab to check availability of car settings
    const wrapper = createWrapper(document.body);
    act(() => {
      wrapper.findTabs()?.findTabLinkById("car-config")?.click();
    });

    // LED is present but CarConfig is absent
    expect(screen.getByTestId("led-color-settings")).toBeInTheDocument();
    expect(screen.queryByTestId("car-config-settings")).not.toBeInTheDocument();
  });

  it("should not render CameraSettingsContainer when isCameraApiSupported is false", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: false,
    });

    const { container } = render(<SettingsPage />);

    // Switch to Car Configuration tab where CameraSettingsContainer is expected
    const wrapper = createWrapper(container);
    act(() => {
      wrapper.findTabs()?.findTabLinkById("car-config")?.click();
    });

    expect(screen.queryByTestId("camera-settings")).not.toBeInTheDocument();
  });

  it("should render CameraSettingsContainer when isCameraApiSupported is true", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
      isCarConfigSupported: true,
      isCameraApiSupported: true,
    });

    const { container } = render(<SettingsPage />);

    const wrapper = createWrapper(container);
    act(() => {
      wrapper.findTabs()?.findTabLinkById("car-config")?.click();
    });

    expect(screen.getByTestId("camera-settings")).toBeInTheDocument();
  });
});
