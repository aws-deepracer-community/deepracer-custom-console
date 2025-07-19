import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { render, waitFor, act, expectKeyValuePair } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { NetworkSettingsContainer } from "../../../components/settings/network-settings-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
  },
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockApiHelper = vi.mocked(ApiHelper);

describe("NetworkSettingsContainer", () => {
  // Global handler for unhandled promise rejections in tests
  const originalUnhandledRejection = process.listeners("unhandledRejection");

  beforeAll(() => {
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", (reason) => {
      // Ignore expected test errors
      if (reason instanceof Error && reason.message === "Network error") {
        return;
      }
      // Re-throw unexpected errors
      throw reason;
    });
  });

  afterAll(() => {
    process.removeAllListeners("unhandledRejection");
    originalUnhandledRejection.forEach((listener) => {
      process.on("unhandledRejection", listener);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockNetworkResponse = {
    success: true,
    SSID: "DeepRacer-WiFi",
    ip_address: "192.168.1.100",
    is_usb_connected: true,
  };

  describe("Component Rendering", () => {
    it("renders the Network Settings container with data and controls", async () => {
      mockApiHelper.get.mockResolvedValue(mockNetworkResponse);

      const { container } = await act(async () => {
        return render(<NetworkSettingsContainer />);
      });

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

      // Wait for API call to complete and data to be loaded
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_network_details");
      });

      // Check that key-value pairs are displayed with the fetched data
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "DeepRacer-WiFi");
        expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "192.168.1.100");
        expectKeyValuePair(keyValuePairs!, "USB connection", "Connected");
      });

      // Check that the Edit button is present
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));
      expect(editButton).toBeTruthy();
    });

    it("renders with default Unknown values when API fails", async () => {
      mockApiHelper.get.mockResolvedValue(null);

      const { container } = await act(async () => {
        return render(<NetworkSettingsContainer />);
      });

      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");
        expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "Unknown");
        expectKeyValuePair(keyValuePairs!, "USB connection", "Unknown");
      });

      // Check that status indicators show warning for unknown values
      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        expect(statusIndicators).toHaveLength(3);
        statusIndicators.forEach((indicator) => {
          expect(indicator.getElement()).toHaveTextContent("Unknown");
        });
      });
    });

    it("renders with USB not connected status", async () => {
      const mockNetworkResponseUsbDisconnected = {
        success: true,
        SSID: "DeepRacer-WiFi",
        ip_address: "192.168.1.100",
        is_usb_connected: false,
      };

      mockApiHelper.get.mockResolvedValue(mockNetworkResponseUsbDisconnected);

      const { container } = await act(async () => {
        return render(<NetworkSettingsContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_network_details");
      });

      // Check that USB connection shows as "Not Connected"
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "USB connection", "Not Connected");
      });

      // Check that there's an info status indicator for USB connection
      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const usbIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Not Connected")
        );
        expect(usbIndicator).toBeTruthy();
      });
    });

    it("shows initial state before get_network_details API call completes", async () => {
      // Create a promise that we can control to delay the API response
      let resolveApiCall: (value: typeof mockNetworkResponse) => void;
      const apiPromise = new Promise<typeof mockNetworkResponse>((resolve) => {
        resolveApiCall = resolve;
      });

      mockApiHelper.get.mockReturnValue(apiPromise);

      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      // Check that the component renders immediately with default values
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Header should be present
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Network Settings");

      // Check initial key-value pairs with default "Unknown" values
      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");
      expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "Unknown");
      expectKeyValuePair(keyValuePairs!, "USB connection", "Unknown");

      // Check that the Edit button is present
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));
      expect(editButton).toBeTruthy();

      // Now resolve the API call to complete the test
      resolveApiCall!(mockNetworkResponse);

      // Wait for the component to update with real data
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_network_details");
      });
    });
  });

  describe("Button Interactions", () => {
    it("navigates to edit network page when Edit button is clicked", async () => {
      mockApiHelper.get.mockResolvedValue(mockNetworkResponse);

      const { container } = await act(async () => {
        return render(<NetworkSettingsContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_network_details");
      });

      // Find and click the Edit button
      const buttons = wrapper.findAllButtons();
      const editButton = buttons.find((btn) => btn.getElement().textContent?.includes("Edit"));

      expect(editButton).toBeTruthy();
      editButton?.click();

      // Verify navigation is called
      expect(mockNavigate).toHaveBeenCalledWith("/edit-network");
    });
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      // Mock console.error to avoid unhandled error logs
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockApiHelper.get.mockRejectedValue(new Error("Network error"));

      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        // Should still render with default values
        const containerComponent = wrapper.findContainer();
        expect(containerComponent).toBeTruthy();
        const header = containerComponent?.findHeader();
        expect(header?.getElement()).toHaveTextContent("Network Settings");

        // Check status indicators show unknown
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Wi-Fi Network SSID", "Unknown");
        expectKeyValuePair(keyValuePairs!, "Vehicle IP Address", "Unknown");
        expectKeyValuePair(keyValuePairs!, "USB connection", "Unknown");
      });

      // Wait a bit to ensure any promises are settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      consoleSpy.mockRestore();
    });
  });

  describe("Status Indicators", () => {
    it("shows warning indicators for unknown values", async () => {
      const unknownNetworkResponse = {
        success: true,
        SSID: "Unknown",
        ip_address: "Unknown",
        is_usb_connected: undefined,
      };

      mockApiHelper.get.mockResolvedValue(unknownNetworkResponse);

      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        // Check that all status indicators show warning for unknown values
        const statusIndicators = wrapper.findAllStatusIndicators();
        expect(statusIndicators).toHaveLength(3);
        statusIndicators.forEach((indicator) => {
          expect(indicator.getElement()).toHaveTextContent("Unknown");
        });
      });
    });

    it("shows success indicator when USB is connected", async () => {
      mockApiHelper.get.mockResolvedValue(mockNetworkResponse);

      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const successIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Connected")
        );
        expect(successIndicator).toBeTruthy();
      });
    });

    it("shows info indicator when USB is not connected", async () => {
      const mockNetworkResponseUsbDisconnected = {
        success: true,
        SSID: "DeepRacer-WiFi",
        ip_address: "192.168.1.100",
        is_usb_connected: false,
      };

      mockApiHelper.get.mockResolvedValue(mockNetworkResponseUsbDisconnected);

      const { container } = render(<NetworkSettingsContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const infoIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Not Connected")
        );
        expect(infoIndicator).toBeTruthy();
      });
    });
  });
});
