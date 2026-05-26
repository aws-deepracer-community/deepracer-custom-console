import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Mode } from "@cloudscape-design/global-styles";
import GlobalHeader from "../../components/global-header";

// Mock StorageHelper to avoid vitest hoisting issues
vi.mock("../../common/helpers/storage-helper", () => ({
  StorageHelper: {
    getTheme: vi.fn(),
    applyTheme: vi.fn(),
  },
}));

// Mock hooks
vi.mock("../../common/hooks/use-supported-apis", () => ({
  useSupportedApis: vi.fn(),
}));

vi.mock("../../common/hooks/use-preferences", () => ({
  usePreferences: vi.fn(),
}));

// Mock constants
vi.mock("../../common/constants", () => ({
  APP_NAME: "Test App",
}));

// Get references to the mocked functions
import { StorageHelper } from "../../common/helpers/storage-helper";
import { useSupportedApis } from "../../common/hooks/use-supported-apis";
import { usePreferences } from "../../common/hooks/use-preferences";

const mockStorageHelper = vi.mocked(StorageHelper);
const mockUseSupportedApis = vi.mocked(useSupportedApis);
const mockUsePreferences = vi.mocked(usePreferences);

// Mock Cloudscape components
interface MockUtility {
  type: string;
  text?: string;
  onClick?: () => void;
  iconName?: string;
  items?: MockMenuItem[];
  onItemClick?: (event: { detail: { id: string } }) => void;
}

interface MockMenuItem {
  id: string;
  text: string;
  disabled?: boolean;
  description?: string;
}

interface MockIdentity {
  title: string;
  href: string;
  logo: { src: string; alt: string };
}

vi.mock("@cloudscape-design/components", () => ({
  TopNavigation: ({
    identity,
    utilities,
  }: {
    identity: MockIdentity;
    utilities: MockUtility[];
  }) => (
    <div data-testid="top-navigation">
      <div data-testid="identity">
        <h1>{identity.title}</h1>
        <img src={identity.logo.src} alt={identity.logo.alt} />
      </div>
      <div data-testid="utilities">
        {utilities.map((utility: MockUtility, index: number) => (
          <div key={index} data-testid={`utility-${index}`}>
            {utility.type === "button" && (
              <button onClick={utility.onClick} data-testid="theme-button">
                {utility.text}
              </button>
            )}
            {utility.type === "menu-dropdown" && (
              <div data-testid="settings-menu">
                <div data-testid="settings-icon">{utility.iconName}</div>
                {utility.items?.map((item: MockMenuItem, itemIndex: number) => (
                  <button
                    key={itemIndex}
                    data-testid={`menu-item-${item.id}`}
                    disabled={item.disabled}
                    onClick={() => utility.onItemClick?.({ detail: { id: item.id } })}
                  >
                    {item.text}
                    {item.description && (
                      <span data-testid={`${item.id}-description`}>{item.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
}));

describe("GlobalHeader", () => {
  const mockSetEnableSpeedAdjustment = vi.fn();
  const mockSetEnableDeviceStatus = vi.fn();

  const createMockSupportedApisState = (isDeviceStatusSupported: boolean) => ({
    supportedApis: [],
    isEmergencyStopSupported: false,
    isDeviceStatusSupported,
    isTimeApiSupported: false,
    isLoading: false,
    hasError: false,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockStorageHelper.getTheme.mockReturnValue(Mode.Light);
    mockStorageHelper.applyTheme.mockImplementation((theme) => theme);

    mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(true));

    mockUsePreferences.mockReturnValue({
      settings: {
        enableSpeedAdjustment: false,
        enableDeviceStatus: false,
      },
      setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
      setEnableDeviceStatus: mockSetEnableDeviceStatus,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("should render the global header with correct structure", () => {
      render(<GlobalHeader />);

      expect(screen.getByTestId("top-navigation")).toBeInTheDocument();
      expect(screen.getByTestId("identity")).toBeInTheDocument();
      expect(screen.getByText("AWS DeepRacer")).toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAttribute("src", "/static/images/deepracer.png");
      expect(screen.getByRole("img")).toHaveAttribute("alt", "Test App Logo");
    });

    it("should render theme toggle button with correct initial text for light mode", () => {
      mockStorageHelper.getTheme.mockReturnValue(Mode.Light);

      render(<GlobalHeader />);

      expect(screen.getByTestId("theme-button")).toHaveTextContent("Dark Mode");
    });

    it("should render theme toggle button with correct initial text for dark mode", () => {
      mockStorageHelper.getTheme.mockReturnValue(Mode.Dark);

      render(<GlobalHeader />);

      expect(screen.getByTestId("theme-button")).toHaveTextContent("Light Mode");
    });

    it("should render settings menu with correct items", () => {
      render(<GlobalHeader />);

      expect(screen.getByTestId("settings-menu")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toHaveTextContent("settings");
      expect(screen.getByTestId("menu-item-speed-adjustment")).toBeInTheDocument();
      expect(screen.getByTestId("menu-item-device-status")).toBeInTheDocument();
    });

    it("should show correct text for disabled speed adjustment", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: false,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-speed-adjustment")).toHaveTextContent(
        "Enable 5x Speed Adjustment"
      );
    });

    it("should show correct text for enabled speed adjustment", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-speed-adjustment")).toHaveTextContent(
        "Disable 5x Speed Adjustment"
      );
    });

    it("should show correct text for disabled device status", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: false,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-device-status")).toHaveTextContent(
        "Enable Car Health Monitoring"
      );
    });

    it("should show correct text for enabled device status", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: false,
          enableDeviceStatus: true,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-device-status")).toHaveTextContent(
        "Disable Car Health Monitoring"
      );
    });
  });

  describe("theme switching", () => {
    it("should switch from light to dark mode", () => {
      mockStorageHelper.getTheme.mockReturnValue(Mode.Light);

      render(<GlobalHeader />);

      const themeButton = screen.getByTestId("theme-button");
      fireEvent.click(themeButton);

      expect(mockStorageHelper.applyTheme).toHaveBeenCalledWith(Mode.Dark);
    });

    it("should switch from dark to light mode", () => {
      mockStorageHelper.getTheme.mockReturnValue(Mode.Dark);

      render(<GlobalHeader />);

      const themeButton = screen.getByTestId("theme-button");
      fireEvent.click(themeButton);

      expect(mockStorageHelper.applyTheme).toHaveBeenCalledWith(Mode.Light);
    });

    it("should update button text after theme change", () => {
      mockStorageHelper.getTheme.mockReturnValue(Mode.Light);
      mockStorageHelper.applyTheme.mockReturnValue(Mode.Dark);

      render(<GlobalHeader />);

      const themeButton = screen.getByTestId("theme-button");
      expect(themeButton).toHaveTextContent("Dark Mode");

      fireEvent.click(themeButton);

      expect(themeButton).toHaveTextContent("Light Mode");
    });
  });

  describe("settings toggles", () => {
    it("should toggle speed adjustment from disabled to enabled", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: false,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      const speedAdjustmentButton = screen.getByTestId("menu-item-speed-adjustment");
      fireEvent.click(speedAdjustmentButton);

      expect(mockSetEnableSpeedAdjustment).toHaveBeenCalledWith(true);
    });

    it("should toggle speed adjustment from enabled to disabled", () => {
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      const speedAdjustmentButton = screen.getByTestId("menu-item-speed-adjustment");
      fireEvent.click(speedAdjustmentButton);

      expect(mockSetEnableSpeedAdjustment).toHaveBeenCalledWith(false);
    });

    it("should toggle device status when supported", () => {
      mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(true));

      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: false,
          enableDeviceStatus: false,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      render(<GlobalHeader />);

      const deviceStatusButton = screen.getByTestId("menu-item-device-status");
      fireEvent.click(deviceStatusButton);

      expect(mockSetEnableDeviceStatus).toHaveBeenCalledWith(true);
    });

    it("should not toggle device status when not supported", () => {
      mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(false));

      render(<GlobalHeader />);

      const deviceStatusButton = screen.getByTestId("menu-item-device-status");
      fireEvent.click(deviceStatusButton);

      expect(mockSetEnableDeviceStatus).not.toHaveBeenCalled();
    });

    it("should show device status as disabled when not supported", () => {
      mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(false));

      render(<GlobalHeader />);

      const deviceStatusButton = screen.getByTestId("menu-item-device-status");
      expect(deviceStatusButton).toBeDisabled();
      expect(screen.getByTestId("device-status-description")).toHaveTextContent(
        "Not supported on this device"
      );
    });

    it("should not show description when device status is supported", () => {
      mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(true));

      render(<GlobalHeader />);

      expect(screen.queryByTestId("device-status-description")).not.toBeInTheDocument();
    });
  });

  describe("hook integration", () => {
    it("should call useSupportedApis hook", () => {
      render(<GlobalHeader />);

      expect(mockUseSupportedApis).toHaveBeenCalledOnce();
    });

    it("should call usePreferences hook", () => {
      render(<GlobalHeader />);

      expect(mockUsePreferences).toHaveBeenCalledOnce();
    });

    it("should call StorageHelper.getTheme on mount", () => {
      render(<GlobalHeader />);

      expect(mockStorageHelper.getTheme).toHaveBeenCalledOnce();
    });

    it("should respond to changes in preferences settings", () => {
      const { rerender } = render(<GlobalHeader />);

      // Initially disabled
      expect(screen.getByTestId("menu-item-speed-adjustment")).toHaveTextContent(
        "Enable 5x Speed Adjustment"
      );

      // Update preferences
      mockUsePreferences.mockReturnValue({
        settings: {
          enableSpeedAdjustment: true,
          enableDeviceStatus: true,
        },
        setEnableSpeedAdjustment: mockSetEnableSpeedAdjustment,
        setEnableDeviceStatus: mockSetEnableDeviceStatus,
      });

      rerender(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-speed-adjustment")).toHaveTextContent(
        "Disable 5x Speed Adjustment"
      );
      expect(screen.getByTestId("menu-item-device-status")).toHaveTextContent(
        "Disable Car Health Monitoring"
      );
    });

    it("should respond to changes in API support", () => {
      const { rerender } = render(<GlobalHeader />);

      // Initially supported
      expect(screen.getByTestId("menu-item-device-status")).not.toBeDisabled();

      // Update API support
      mockUseSupportedApis.mockReturnValue(createMockSupportedApisState(false));

      rerender(<GlobalHeader />);

      expect(screen.getByTestId("menu-item-device-status")).toBeDisabled();
    });
  });

  describe("container styling", () => {
    it("should render with correct container styles", () => {
      render(<GlobalHeader />);

      const container = screen.getByTestId("top-navigation").parentElement;
      expect(container).toHaveAttribute("id", "awsui-top-navigation");
      expect(container).toHaveStyle({
        zIndex: "1002",
        top: "0",
        left: "0",
        right: "0",
        position: "fixed",
      });
    });
  });
});
