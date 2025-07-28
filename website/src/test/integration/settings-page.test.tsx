import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  screen,
  render,
} from "../utils";
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
  DeviceConsolePasswordContainer: () => <div data-testid="console-password-settings">Console Password Settings</div>,
  DeviceSshContainer: () => <div data-testid="ssh-settings">SSH Settings</div>,
  TimeContainer: () => <div data-testid="time-settings">Time Settings</div>,
  LedColorContainer: () => <div data-testid="led-color-settings">LED Color Settings</div>,
  AboutContainer: () => <div data-testid="about-settings">About Settings</div>,
}));

describe("SettingsPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render settings page with basic structure", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
    });

    render(<SettingsPage />);

    // Verify the mocked BaseAppLayout is rendered
    expect(screen.getByTestId("base-app-layout")).toBeInTheDocument();
    
    // Verify main header and description
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Adjust your DeepRacer car settings")).toBeInTheDocument();
  });

  it("should render all settings containers when isTimeApiSupported is true", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
    });

    render(<SettingsPage />);

    // Verify all containers are rendered
    expect(screen.getByTestId("network-settings")).toBeInTheDocument();
    expect(screen.getByTestId("console-password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("ssh-settings")).toBeInTheDocument();
    expect(screen.getByTestId("time-settings")).toBeInTheDocument();
    expect(screen.getByTestId("led-color-settings")).toBeInTheDocument();
    expect(screen.getByTestId("about-settings")).toBeInTheDocument();
  });

  it("should not render TimeContainer when isTimeApiSupported is false", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: false,
    });

    render(<SettingsPage />);

    // Verify TimeContainer is not rendered
    expect(screen.queryByTestId("time-settings")).not.toBeInTheDocument();
    
    // Verify other containers are still rendered
    expect(screen.getByTestId("network-settings")).toBeInTheDocument();
    expect(screen.getByTestId("console-password-settings")).toBeInTheDocument();
    expect(screen.getByTestId("ssh-settings")).toBeInTheDocument();
    expect(screen.getByTestId("led-color-settings")).toBeInTheDocument();
    expect(screen.getByTestId("about-settings")).toBeInTheDocument();
  });

  it("should have proper layout structure using Cloudscape components", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
    });

    render(<SettingsPage />);

    const wrapper = createWrapper(document.body);
    
    // Check for SpaceBetween layout
    const spaceBetween = wrapper.findSpaceBetween();
    expect(spaceBetween).toBeTruthy();

    // Check for TextContent
    const textContent = wrapper.findTextContent();
    expect(textContent).toBeTruthy();
    
    // Check for Header component
    const header = wrapper.findHeader();
    expect(header).toBeTruthy();
    expect(header?.getElement()).toHaveTextContent("Settings");
  });

  it("should call useSupportedApis hook correctly", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
    });

    render(<SettingsPage />);

    // Verify the hook was called
    expect(mockUseSupportedApis).toHaveBeenCalled();
  });

  it("should be wrapped in BaseAppLayout component", () => {
    mockUseSupportedApis.mockReturnValue({
      isTimeApiSupported: true,
    });

    render(<SettingsPage />);

    // Check that BaseAppLayout mock is rendered
    expect(screen.getByTestId("base-app-layout")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
