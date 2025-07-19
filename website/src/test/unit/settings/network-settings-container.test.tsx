import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, expectKeyValuePair } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { NetworkSettingsContainer } from "../../../components/settings/network-settings-container";
import { NetworkContext } from "../../../common/hooks/use-network";

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NetworkSettingsContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockNetworkState = {
    ssid: "DeepRacer-WiFi",
    ipAddresses: ["192.168.1.100"],
    isLoading: false,
    isUSBConnected: true,
    hasError: false,
  };

  // Helper function to render component with custom network context
  const renderWithNetworkContext = (networkContextValue: {
    ssid: string;
    ipAddresses: string[];
    isLoading: boolean;
    isUSBConnected: boolean;
    hasError: boolean;
  }) => {
    const { container } = render(
      <NetworkContext.Provider value={networkContextValue}>
        <NetworkSettingsContainer />
      </NetworkContext.Provider>
    );
    return { container };
  };

  describe("Component Rendering", () => {
    it("renders the Network Settings container with data and controls", () => {
      const { container } = renderWithNetworkContext(mockNetworkState);
      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Check header
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Network Settings");
      expect(header?.getElement()).toHaveTextContent(
        "Network refresh happens at 1 minute intervals"
      );

      // Check that key-value pairs are displayed with the provided data
      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "DeepRacer-WiFi");
      expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "192.168.1.100");
      expectKeyValuePair(keyValuePairs!, "USB connection", "Connected");

      // Check that the Edit button is present
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));
      expect(editButton).toBeTruthy();
    });

    it("renders with default Unknown values when there's an error", () => {
      const errorNetworkState = {
        ssid: "",
        ipAddresses: [],
        isLoading: false,
        isUSBConnected: false,
        hasError: true,
      };

      const { container } = renderWithNetworkContext(errorNetworkState);
      const wrapper = createWrapper(container);

      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");
      expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "Unknown");
      expectKeyValuePair(keyValuePairs!, "USB connection", "Unknown");

      // Check that status indicators show warning for unknown values
      const statusIndicators = wrapper.findAllStatusIndicators();
      expect(statusIndicators).toHaveLength(3);
      statusIndicators.forEach((indicator) => {
        expect(indicator.getElement()).toHaveTextContent("Unknown");
      });
    });

    it("renders with USB not connected status", () => {
      const usbDisconnectedState = {
        ssid: "DeepRacer-WiFi",
        ipAddresses: ["192.168.1.100"],
        isLoading: false,
        isUSBConnected: false,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(usbDisconnectedState);
      const wrapper = createWrapper(container);

      // Check that USB connection shows as "Not Connected"
      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "USB connection", "Not Connected");

      // Check that there's an info status indicator for USB connection
      const statusIndicators = wrapper.findAllStatusIndicators();
      const usbIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Not Connected")
      );
      expect(usbIndicator).toBeTruthy();
    });

    it("handles multiple IP addresses correctly", () => {
      const multipleIpState = {
        ssid: "DeepRacer-WiFi",
        ipAddresses: ["192.168.1.100", "10.0.0.50"],
        isLoading: false,
        isUSBConnected: true,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(multipleIpState);
      const wrapper = createWrapper(container);

      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "192.168.1.100, 10.0.0.50");
    });

    it("handles unknown SSID value", () => {
      const unknownSsidState = {
        ssid: "Unknown",
        ipAddresses: ["192.168.1.100"],
        isLoading: false,
        isUSBConnected: true,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(unknownSsidState);
      const wrapper = createWrapper(container);

      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");

      // Check that status indicator shows warning for unknown SSID
      const statusIndicators = wrapper.findAllStatusIndicators();
      const ssidIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Unknown")
      );
      expect(ssidIndicator).toBeTruthy();
    });
  });

  describe("Button Interactions", () => {
    it("navigates to edit network page when Edit button is clicked", () => {
      const { container } = renderWithNetworkContext(mockNetworkState);
      const wrapper = createWrapper(container);

      // Find and click the Edit button
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));

      expect(editButton).toBeTruthy();
      editButton?.click();

      // Verify navigation is called
      expect(mockNavigate).toHaveBeenCalledWith("/edit-network");
    });
  });

  describe("Status Indicators", () => {
    it("shows warning indicators for unknown values", () => {
      const unknownNetworkState = {
        ssid: "Unknown",
        ipAddresses: [],
        isLoading: false,
        isUSBConnected: false,
        hasError: true,
      };

      const { container } = renderWithNetworkContext(unknownNetworkState);
      const wrapper = createWrapper(container);

      // Check that all status indicators show warning for unknown values
      const statusIndicators = wrapper.findAllStatusIndicators();
      expect(statusIndicators).toHaveLength(3);
      statusIndicators.forEach((indicator) => {
        expect(indicator.getElement()).toHaveTextContent("Unknown");
      });
    });

    it("shows success indicator when USB is connected", () => {
      const { container } = renderWithNetworkContext(mockNetworkState);
      const wrapper = createWrapper(container);

      const statusIndicators = wrapper.findAllStatusIndicators();
      const successIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Connected")
      );
      expect(successIndicator).toBeTruthy();
    });

    it("shows info indicator when USB is not connected", () => {
      const usbDisconnectedState = {
        ssid: "DeepRacer-WiFi",
        ipAddresses: ["192.168.1.100"],
        isLoading: false,
        isUSBConnected: false,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(usbDisconnectedState);
      const wrapper = createWrapper(container);

      const statusIndicators = wrapper.findAllStatusIndicators();
      const infoIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Not Connected")
      );
      expect(infoIndicator).toBeTruthy();
    });

    it("shows warning indicator when there's an error state", () => {
      const errorNetworkState = {
        ssid: "",
        ipAddresses: [],
        isLoading: false,
        isUSBConnected: false,
        hasError: true,
      };

      const { container } = renderWithNetworkContext(errorNetworkState);
      const wrapper = createWrapper(container);

      const statusIndicators = wrapper.findAllStatusIndicators();
      expect(statusIndicators).toHaveLength(3);
      statusIndicators.forEach((indicator) => {
        expect(indicator.getElement()).toHaveTextContent("Unknown");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty IP addresses array", () => {
      const emptyIpState = {
        ssid: "DeepRacer-WiFi",
        ipAddresses: [],
        isLoading: false,
        isUSBConnected: true,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(emptyIpState);
      const wrapper = createWrapper(container);

      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "Unknown");
    });

    it("handles empty SSID", () => {
      const emptySsidState = {
        ssid: "",
        ipAddresses: ["192.168.1.100"],
        isLoading: false,
        isUSBConnected: true,
        hasError: false,
      };

      const { container } = renderWithNetworkContext(emptySsidState);
      const wrapper = createWrapper(container);

      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");
    });

    it("renders correctly when using default test context", () => {
      // This test uses the default mock network provider from test utils
      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Check header
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Network Settings");

      // Check that the Edit button is present
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));
      expect(editButton).toBeTruthy();
    });
  });
});
