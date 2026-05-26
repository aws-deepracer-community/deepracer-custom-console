import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, waitFor, act, expectKeyValuePair } from "../../utils";
import userEvent from "@testing-library/user-event";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { AboutContainer } from "../../../components/settings/about-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock the SoftwareUpdateModal component
vi.mock("../../../components/settings/software-update-modal", () => ({
  SoftwareUpdateModal: ({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) => (
    <div data-testid="software-update-modal" style={{ display: visible ? "block" : "none" }}>
      <button onClick={onDismiss}>Close Modal</button>
    </div>
  ),
}));

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
  },
}));

const mockApiHelper = vi.mocked(ApiHelper);

describe("AboutContainer", () => {
  // Global handler for unhandled promise rejections in tests
  const originalUnhandledRejection = process.listeners("unhandledRejection");

  beforeAll(() => {
    process.removeAllListeners("unhandledRejection");
    process.on("unhandledRejection", (reason) => {
      // Ignore expected test errors
      if (
        reason instanceof Error &&
        (reason.message === "Timeout" ||
          reason.message === "Network error" ||
          reason.message === "Software update check failed")
      ) {
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
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockDeviceInfoResponse = {
    success: true,
    hardware_version: "EVO-1.0",
    software_version: "2.0.0",
    cpu_model: "Intel Atom™ Processor",
    ram_amount: "4 GB",
    disk_amount: "32 GB",
    ros_distro: "ROS2 Foxy",
    os_version: "Ubuntu OS 20.04.1 LTS",
  };

  const mockSoftwareUpdateResponse = {
    success: true,
    status: true,
  };

  const mockMandatoryUpdateResponse = {
    success: true,
    status: false,
  };

  describe("Component Rendering", () => {
    it("renders the About container with correct header", async () => {
      mockApiHelper.get.mockResolvedValue(mockDeviceInfoResponse);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Use wrapper methods to find specific elements
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("About");
      expect(header?.getElement()).toHaveTextContent(
        "AWS DeepRacer vehicle 1/18th scale 4WD monster truck chassis"
      );
    });

    it("renders all key-value pairs with default values when API fails", async () => {
      mockApiHelper.get.mockResolvedValue(null);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        const kvItems = keyValuePairs!.findItems();
        expect(kvItems.length).toBe(8);

        // Test all expected key-value pairs with their default values
        expectKeyValuePair(
          keyValuePairs!,
          "Operating System",
          "undefined, Intel® OpenVINO™ toolkit, undefined"
        );
        expectKeyValuePair(keyValuePairs!, "Software Version", "Unknown");
        expectKeyValuePair(keyValuePairs!, "Software Update Available", "Unknown");
        expectKeyValuePair(keyValuePairs!, "Mandatory Update", "-");
        expectKeyValuePair(keyValuePairs!, "Hardware Version", "Unknown");
        expectKeyValuePair(keyValuePairs!, "Processor", ""); // Empty when deviceInfo.cpu_model is undefined
        expectKeyValuePair(keyValuePairs!, "Memory", "undefined RAM/undefined Storage");
        expectKeyValuePair(keyValuePairs!, "Camera", "4MP with MJPEG");
      });
    });

    it("displays unknown status indicators when device info is not available", async () => {
      mockApiHelper.get.mockResolvedValue(null);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        expect(statusIndicators).toHaveLength(3); // Software version, software update, hardware version
        statusIndicators.forEach((indicator) => {
          expect(indicator.getElement()).toHaveTextContent("Unknown");
        });
      });
    });
  });

  describe("API Data Loading", () => {
    it("fetches and displays device information correctly", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce(mockSoftwareUpdateResponse)
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_device_info");
        expect(mockApiHelper.get).toHaveBeenCalledWith("is_software_update_available", 30000);
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_mandatory_update_status");
      });

      // Check that device info is displayed using key-value pairs
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Hardware Version", "EVO-1.0");
        expectKeyValuePair(keyValuePairs!, "Software Version", "2.0.0");
        expectKeyValuePair(keyValuePairs!, "Processor", "Intel Atom™ Processor");
        expectKeyValuePair(keyValuePairs!, "Memory", "4 GB RAM/32 GB Storage");
      });
    });

    it("uses fallback values when device info fields are missing", async () => {
      const incompleteDeviceInfo = {
        success: true,
        hardware_version: "EVO-1.0",
        software_version: "2.0.0",
        // Missing optional fields
      };

      mockApiHelper.get
        .mockResolvedValueOnce(incompleteDeviceInfo)
        .mockResolvedValueOnce(mockSoftwareUpdateResponse)
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Processor", "Intel Atom™ Processor");
        expectKeyValuePair(keyValuePairs!, "Memory", "4 GB RAM/32 GB Storage");
        expectKeyValuePair(
          keyValuePairs!,
          "Operating System",
          "Ubuntu OS 20.04.1 LTS, Intel® OpenVINO™ toolkit, ROS2 Foxy"
        );
      });
    });

    it("handles API timeout for software update check", async () => {
      // Mock console.error to avoid unhandled error logs
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      await act(async () => {
        render(<AboutContainer />);
      });

      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("is_software_update_available", 30000);
      });

      // Wait a bit to ensure any promises are settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      consoleSpy.mockRestore();
    });
  });

  describe("Software Update Status", () => {
    it('shows "Software update available" when update is available', async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: true })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = await act(async () => {
        return render(<AboutContainer />);
      });

      const wrapper = createWrapper(container);

      await act(async () => {
        await waitFor(() => {
          const statusIndicators = wrapper.findAllStatusIndicators();
          const warningIndicator = statusIndicators.find((indicator) =>
            indicator.getElement().textContent?.includes("Software update available")
          );
          expect(warningIndicator).toBeTruthy();
        });
      });
    });

    it('shows "Software up to date" when no update is available', async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: false })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const successIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Software up to date")
        );
        expect(successIndicator).toBeTruthy();
      });
    });

    it('shows "Unknown" when software update status cannot be determined', async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce(null) // Failed API call
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const unknownIndicators = statusIndicators.filter((indicator) =>
          indicator.getElement().textContent?.includes("Unknown")
        );
        expect(unknownIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Update Software Button", () => {
    it("renders disabled when no software update is available", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: false })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const button = wrapper.findButton();
        expect(button?.getElement()).toBeDisabled();
      });
    });

    it("renders enabled when software update is available", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: true })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const button = wrapper.findButton();
        expect(button?.getElement()).not.toBeDisabled();
      });
    });

    it("renders disabled when software update status is unknown", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const button = wrapper.findButton();
        expect(button?.getElement()).toBeDisabled();
      });
    });

    it("opens software update modal when clicked", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: true })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const button = wrapper.findButton();
        expect(button?.getElement()).not.toBeDisabled();
      });

      // Use wrapper to click the button
      const button = wrapper.findButton();
      button?.click();

      await waitFor(() => {
        expect(screen.getByTestId("software-update-modal")).toBeVisible();
      });
    });
  });

  describe("Software Update Modal", () => {
    it("initially hides the software update modal", async () => {
      mockApiHelper.get.mockResolvedValue(mockDeviceInfoResponse);

      render(<AboutContainer />);

      await waitFor(() => {
        const modal = screen.getByTestId("software-update-modal");
        expect(modal).not.toBeVisible();
      });
    });

    it("shows modal when update button is clicked and hides when dismissed", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: true })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      // Wait for component to load and button to be enabled
      await waitFor(() => {
        const button = wrapper.findButton();
        expect(button?.getElement()).not.toBeDisabled();
      });

      // Click update button using wrapper
      const button = wrapper.findButton();
      button?.click();

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId("software-update-modal")).toBeVisible();
      });

      // Click close button in modal
      const closeButton = screen.getByRole("button", { name: /close modal/i });
      await user.click(closeButton);

      // Modal should be hidden
      await waitFor(() => {
        expect(screen.getByTestId("software-update-modal")).not.toBeVisible();
      });
    });
  });

  describe("Status Indicators", () => {
    it("shows warning indicators for unknown values", async () => {
      const unknownDeviceInfo = {
        success: true,
        hardware_version: "Unknown",
        software_version: "Unknown",
      };

      mockApiHelper.get
        .mockResolvedValueOnce(unknownDeviceInfo)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        // We expect warning indicators for unknown software version, hardware version, and software update status
        const statusIndicators = wrapper.findAllStatusIndicators();
        expect(statusIndicators).toHaveLength(3);
        statusIndicators.forEach((indicator) => {
          expect(indicator.getElement()).toHaveTextContent("Unknown");
        });
      });
    });

    it("shows success indicator when software is up to date", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: false })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const successIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Software up to date")
        );
        expect(successIndicator).toBeTruthy();
      });
    });

    it("shows warning indicator when software update is available", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce({ success: true, status: true })
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const statusIndicators = wrapper.findAllStatusIndicators();
        const warningIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Software update available")
        );
        expect(warningIndicator).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      // Mock console.error to avoid unhandled error logs
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockApiHelper.get.mockRejectedValue(new Error("Network error"));

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        // Should still render with default values using wrapper methods
        const containerComponent = wrapper.findContainer();
        expect(containerComponent).toBeTruthy();
        const header = containerComponent?.findHeader();
        expect(header?.getElement()).toHaveTextContent("About");

        // Check status indicators show unknown
        const statusIndicators = wrapper.findAllStatusIndicators();
        expect(statusIndicators.length).toBeGreaterThan(0);
      });

      // Wait a bit to ensure any promises are settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      consoleSpy.mockRestore();
    });

    it("handles partial API failures", async () => {
      // Mock console.error to avoid unhandled error logs
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockRejectedValueOnce(new Error("Software update check failed"))
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        // Device info should be loaded in key-value pairs
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Hardware Version", "EVO-1.0");
        expectKeyValuePair(keyValuePairs!, "Software Version", "2.0.0");

        // Software update status should show as unknown
        const statusIndicators = wrapper.findAllStatusIndicators();
        const unknownIndicator = statusIndicators.find((indicator) =>
          indicator.getElement().textContent?.includes("Unknown")
        );
        expect(unknownIndicator).toBeTruthy();
      });

      // Wait a bit to ensure any promises are settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      consoleSpy.mockRestore();
    });
  });

  describe("Operating System Display", () => {
    it("concatenates OS version, OpenVINO toolkit, and ROS distro correctly", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockDeviceInfoResponse)
        .mockResolvedValueOnce(mockSoftwareUpdateResponse)
        .mockResolvedValueOnce(mockMandatoryUpdateResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(
          keyValuePairs!,
          "Operating System",
          "Ubuntu OS 20.04.1 LTS, Intel® OpenVINO™ toolkit, ROS2 Foxy"
        );
      });
    });
  });

  describe("Fixed Values", () => {
    it("displays correct camera specification", async () => {
      mockApiHelper.get.mockResolvedValue(mockDeviceInfoResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Camera", "4MP with MJPEG");
      });
    });

    it("displays mandatory update as dash", async () => {
      mockApiHelper.get.mockResolvedValue(mockDeviceInfoResponse);

      const { container } = render(<AboutContainer />);
      const wrapper = createWrapper(container);

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Mandatory Update", "-");
      });
    });
  });
});
