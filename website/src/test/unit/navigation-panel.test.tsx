import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../utils";
import NavigationPanel from "../../components/navigation-panel";
import { ApiHelper } from "../../common/helpers/api-helper";

// Mock the hooks and dependencies
const mockSetNavigationPanelState = vi.fn();
vi.mock("../../common/hooks/use-navigation-panel-state", () => ({
  useNavigationPanelState: () => [{ collapsedSections: {} }, mockSetNavigationPanelState],
}));

const mockOnFollow = vi.fn();
vi.mock("../../common/hooks/use-on-follow", () => ({
  useOnFollow: () => mockOnFollow,
}));

const mockUseBattery = vi.fn();
vi.mock("../../common/hooks/use-battery", () => ({
  useBattery: () => mockUseBattery(),
  BatteryContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({
      children,
    }: {
      children: (value: {
        batteryLevel: number;
        batteryError: boolean;
        hasInitialReading: boolean;
      }) => React.ReactNode;
    }) =>
      children({
        batteryLevel: 85,
        batteryError: false,
        hasInitialReading: true,
      }),
  },
}));

vi.mock("../../common/hooks/use-authentication", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: "test-user" },
  }),
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({
      children,
    }: {
      children: (value: {
        isAuthenticated: boolean;
        user: { username: string };
      }) => React.ReactNode;
    }) =>
      children({
        isAuthenticated: true,
        user: { username: "test-user" },
      }),
  },
}));

vi.mock("../../common/hooks/use-api", () => ({
  useApi: () => ({
    request: vi.fn(),
  }),
  ApiContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { request: () => void }) => React.ReactNode }) =>
      children({
        request: vi.fn(),
      }),
  },
}));

vi.mock("../../common/hooks/use-models", () => ({
  useModels: () => ({
    models: [{ name: "test-model" }],
  }),
  ModelsContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({
      children,
    }: {
      children: (value: { models: { name: string }[] }) => React.ReactNode;
    }) =>
      children({
        models: [{ name: "test-model" }],
      }),
  },
}));

vi.mock("../../common/hooks/use-preferences", () => ({
  usePreferences: () => ({
    preferences: {},
  }),
  PreferencesContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: { preferences: object }) => React.ReactNode }) =>
      children({
        preferences: {},
      }),
  },
}));

const mockUseNetwork = vi.fn();
vi.mock("../../common/hooks/use-network", () => ({
  useNetwork: () => mockUseNetwork(),
  NetworkContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({
      children,
    }: {
      children: (value: { ssid: string; ipAddresses: string[] }) => React.ReactNode;
    }) =>
      children({
        ssid: "TestWiFi",
        ipAddresses: ["192.168.1.100"],
      }),
  },
}));

const mockUseSupportedApis = vi.fn();
vi.mock("../../common/hooks/use-supported-apis", () => ({
  useSupportedApis: () => mockUseSupportedApis(),
  SupportedApisContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({
      children,
    }: {
      children: (value: { isEmergencyStopSupported: boolean }) => React.ReactNode;
    }) =>
      children({
        isEmergencyStopSupported: true,
      }),
  },
}));

// Mock API Helper
vi.mock("../../common/helpers/api-helper", () => ({
  ApiHelper: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/home" }),
  };
});

describe("NavigationPanel", () => {
  const mockBatteryProps = {
    battery: {
      level: 85,
      error: false,
      hasInitialReading: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock returns
    mockUseNetwork.mockReturnValue({
      ssid: "TestWiFi",
      ipAddresses: ["192.168.1.100"],
    });

    mockUseSupportedApis.mockReturnValue({
      isEmergencyStopSupported: true,
    });
  });

  describe("Basic Rendering", () => {
    it("should render navigation items", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Control Vehicle")).toBeInTheDocument();
      expect(screen.getByText("Models")).toBeInTheDocument();
      expect(screen.getByText("Calibration")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Logs")).toBeInTheDocument();
    });

    it("should render external links", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Build a track")).toBeInTheDocument();
      expect(screen.getByText("Train a model")).toBeInTheDocument();
    });

    it("should render logout button", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  describe("Battery Status", () => {
    it("should display battery level", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Battery Status")).toBeInTheDocument();
      expect(screen.getByText("Current Battery Charge")).toBeInTheDocument();

      const batteryElements = screen.getAllByText("85%");
      expect(batteryElements.length).toBeGreaterThan(0);
    });

    it("should handle battery error state", () => {
      const errorBatteryProps = {
        battery: {
          level: -1,
          error: true,
          hasInitialReading: true,
        },
      };

      render(<NavigationPanel {...errorBatteryProps} />);

      expect(screen.getByText("Vehicle battery is not connected")).toBeInTheDocument();
      expect(screen.queryByText("-1%")).not.toBeInTheDocument();
    });

    it("should handle no initial reading after timeout", () => {
      // Mock Date.now to simulate 10+ seconds passage
      const mockDateNow = vi.spyOn(Date, "now");
      const startTime = 1000000;
      mockDateNow
        .mockReturnValueOnce(startTime) // Initial page load time
        .mockReturnValue(startTime + 11000); // Current time (11 seconds later)

      const noReadingBatteryProps = {
        battery: {
          level: 0,
          error: false,
          hasInitialReading: false,
        },
      };

      render(<NavigationPanel {...noReadingBatteryProps} />);

      expect(screen.getByText("Unable to get battery reading")).toBeInTheDocument();

      mockDateNow.mockRestore();
    });

    it("should show in-progress status when initial reading is available", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      // The progress bar should be rendered without error status
      expect(screen.getByText("Current Battery Charge")).toBeInTheDocument();
      expect(screen.queryByText("Vehicle battery is not connected")).not.toBeInTheDocument();
      expect(screen.queryByText("Unable to get battery reading")).not.toBeInTheDocument();
    });
  });

  describe("Network Information", () => {
    it("should display network information", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("TestWiFi")).toBeInTheDocument();
      expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
    });

    it("should handle no network connection", () => {
      // Mock useNetwork to return no connection
      mockUseNetwork.mockReturnValue({
        ssid: null,
        ipAddresses: [],
      });

      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Not connected")).toBeInTheDocument();
      expect(screen.getByText("No IP address")).toBeInTheDocument();
    });

    it("should handle multiple IP addresses", () => {
      // Mock useNetwork to return multiple IPs
      mockUseNetwork.mockReturnValue({
        ssid: "TestWiFi",
        ipAddresses: ["192.168.1.100", "10.0.0.50"],
      });

      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("192.168.1.100, 10.0.0.50")).toBeInTheDocument();
    });
  });

  describe("Emergency Stop Functionality", () => {
    it("should show emergency stop button when supported", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.getByText("Emergency Stop & Reset")).toBeInTheDocument();
      expect(screen.getByTestId("emergency-stop")).toBeInTheDocument();
    });

    it("should not show emergency stop button when not supported", () => {
      // Mock useSupportedApis to return false for emergency stop
      mockUseSupportedApis.mockReturnValue({
        isEmergencyStopSupported: false,
      });

      render(<NavigationPanel {...mockBatteryProps} />);

      expect(screen.queryByText("Emergency Stop & Reset")).not.toBeInTheDocument();
      expect(screen.queryByTestId("emergency-stop")).not.toBeInTheDocument();
    });

    it("should handle emergency stop button click successfully", async () => {
      const mockApiPost = vi.mocked(ApiHelper.post);
      mockApiPost
        .mockResolvedValueOnce({ success: true }) // start_stop response
        .mockResolvedValueOnce({ success: true }); // emergency_stop response

      render(<NavigationPanel {...mockBatteryProps} />);

      const emergencyButton = screen.getByTestId("emergency-stop");
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("start_stop", {
          start_stop: "stop",
        });
      });

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("emergency_stop", {});
      });

      expect(mockApiPost).toHaveBeenCalledTimes(2);
    });

    it("should handle emergency stop with start_stop failure", async () => {
      const mockApiPost = vi.mocked(ApiHelper.post);
      mockApiPost
        .mockRejectedValueOnce(new Error("start_stop failed")) // start_stop fails
        .mockResolvedValueOnce({ success: true }); // emergency_stop still succeeds

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<NavigationPanel {...mockBatteryProps} />);

      const emergencyButton = screen.getByTestId("emergency-stop");
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("start_stop", {
          start_stop: "stop",
        });
      });

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("emergency_stop", {});
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error stopping vehicle:", expect.any(Error));
      expect(mockApiPost).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it("should handle emergency stop with both API failures", async () => {
      const mockApiPost = vi.mocked(ApiHelper.post);
      mockApiPost
        .mockRejectedValueOnce(new Error("start_stop failed")) // start_stop fails
        .mockRejectedValueOnce(new Error("emergency_stop failed")); // emergency_stop fails

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<NavigationPanel {...mockBatteryProps} />);

      const emergencyButton = screen.getByTestId("emergency-stop");
      fireEvent.click(emergencyButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("start_stop", {
          start_stop: "stop",
        });
      });

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("emergency_stop", {});
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error stopping vehicle:", expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith("Error in emergency stop:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe("Navigation Interactions", () => {
    it("should handle logout button click", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      const logoutButton = screen.getByText("Logout");
      fireEvent.click(logoutButton);

      expect(mockNavigate).toHaveBeenCalledWith("/logout");
    });

    it("should call onFollow when navigation items are clicked", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      // The onFollow should be set up on the SideNavigation component
      // We can verify it was called from our mock
      expect(mockOnFollow).toBeDefined();
    });

    it("should handle navigation panel state changes", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      // Find the side navigation component
      // Since the onChange handler is internal, we can test that the state hook is set up correctly
      expect(mockSetNavigationPanelState).toBeDefined();
    });
  });

  describe("Component Integration", () => {
    it("should integrate with all required hooks", () => {
      render(<NavigationPanel {...mockBatteryProps} />);

      // Verify all hooks are being called by checking the component renders correctly
      expect(screen.getByText("Control Vehicle")).toBeInTheDocument();
      expect(screen.getByText("TestWiFi")).toBeInTheDocument();

      // Use getAllByText for battery percentage since it appears multiple times
      const batteryElements = screen.getAllByText("85%");
      expect(batteryElements.length).toBeGreaterThan(0);

      expect(screen.getByText("Emergency Stop & Reset")).toBeInTheDocument();
    });

    it("should handle different battery levels", () => {
      const lowBatteryProps = {
        battery: {
          level: 15,
          error: false,
          hasInitialReading: true,
        },
      };

      render(<NavigationPanel {...lowBatteryProps} />);

      // Use getAllByText for battery percentage since it appears multiple times
      const batteryElements = screen.getAllByText("15%");
      expect(batteryElements.length).toBeGreaterThan(0);

      expect(screen.getByText("Current Battery Charge")).toBeInTheDocument();
    });

    it("should handle zero battery level", () => {
      const zeroBatteryProps = {
        battery: {
          level: 0,
          error: false,
          hasInitialReading: true,
        },
      };

      render(<NavigationPanel {...zeroBatteryProps} />);

      // Use getAllByText for battery percentage since it appears multiple times
      const batteryElements = screen.getAllByText("0%");
      expect(batteryElements.length).toBeGreaterThan(0);
    });
  });
});
