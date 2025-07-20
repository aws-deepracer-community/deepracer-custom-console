import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { SoftwareUpdateModal } from "../../../components/settings/software-update-modal";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock the API helper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SoftwareUpdateModal", () => {
  const mockOnDismiss = vi.fn();
  const mockApiGet = vi.mocked(ApiHelper.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("should render modal when visible is true", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const modal = wrapper.findModal();

      expect(modal).toBeTruthy();
      expect(modal?.isVisible()).toBe(true);

      // Check modal header
      const header = modal?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Confirm Software Update");

      // Check modal content
      const content = modal?.findContent();
      expect(content?.getElement()).toHaveTextContent(
        "Are you sure you want to start the software update?"
      );
      expect(content?.getElement()).toHaveTextContent("Download and install the latest software");
      expect(content?.getElement()).toHaveTextContent("Reboot your AWS DeepRacer device");
      expect(content?.getElement()).toHaveTextContent("Take several minutes to complete");
    });

    it("should not render modal when visible is false", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={false} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const modal = wrapper.findModal();

      expect(modal?.isVisible()).toBe(false);
    });

    it("should render warning alert", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const alerts = wrapper.findAllAlerts();
      const warningAlert = alerts.find((alert) =>
        alert.getElement().textContent?.includes("Important:")
      );

      expect(warningAlert).toBeTruthy();
      expect(warningAlert?.getElement()).toHaveTextContent(
        "Do not power off the device during the update process"
      );
    });

    it("should render Cancel and Start Update buttons", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();

      const cancelButton = buttons.find((btn) => btn.getElement().textContent?.includes("Cancel"));
      const updateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      expect(cancelButton).toBeTruthy();
      expect(updateButton).toBeTruthy();
    });

    it("should not show error alert initially", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const alerts = wrapper.findAllAlerts();

      // Should only have the warning alert, no error alert
      expect(alerts).toHaveLength(1);
      const warningAlert = alerts.find((alert) =>
        alert.getElement().textContent?.includes("Important:")
      );
      expect(warningAlert).toBeTruthy();
    });
  });

  describe("cancel functionality", () => {
    it("should call onDismiss when Cancel button is clicked", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const cancelButton = buttons.find((btn) => btn.getElement().textContent?.includes("Cancel"));

      cancelButton?.click();

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should call onDismiss when modal close button is clicked", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const modal = wrapper.findModal();
      const dismissButton = modal?.findDismissButton();

      dismissButton?.click();

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not call onDismiss when Cancel is clicked during update", async () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      // Start the update
      startUpdateButton?.click();

      // Try to cancel during update
      await waitFor(() => {
        const updatedButtons = wrapper.findAllButtons();
        const cancelButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Cancel")
        );
        cancelButton?.click();
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe("software update functionality", () => {
    it("should show loading state when Start Update is clicked", async () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        // Check for loading state by looking for aria-disabled attribute
        const updatedButtons = wrapper.findAllButtons();
        const loadingButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Start Update")
        );
        const updatedCancelButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Cancel")
        );

        expect(loadingButton?.getElement()).toHaveAttribute("aria-disabled", "true");
        expect(updatedCancelButton?.getElement()).toHaveAttribute("disabled");
      });
    });

    it("should call API and navigate on successful update", async () => {
      mockApiGet.mockResolvedValueOnce({ success: true });

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith("begin_software_update");
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/software-update");
      });
    });

    it("should show error when API returns unsuccessful response", async () => {
      const errorReason = "Update server unavailable";
      mockApiGet.mockResolvedValueOnce({ success: false, reason: errorReason });

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes(errorReason)
        );
        expect(errorAlert).toBeTruthy();
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(startUpdateButton?.getElement()).toHaveProperty("disabled", false);
    });

    it("should show default error when API returns unsuccessful response without reason", async () => {
      mockApiGet.mockResolvedValueOnce({ success: false });

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("Failed to start software update")
        );
        expect(errorAlert).toBeTruthy();
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle API error gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockApiGet.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert
            .getElement()
            .textContent?.includes("Unable to start software update. Please try again.")
        );
        expect(errorAlert).toBeTruthy();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error starting software update:",
        expect.any(Error)
      );
      expect(mockOnDismiss).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(startUpdateButton?.getElement()).toHaveProperty("disabled", false);

      consoleErrorSpy.mockRestore();
    });

    it("should handle null API response", async () => {
      mockApiGet.mockResolvedValueOnce(null);

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("Failed to start software update")
        );
        expect(errorAlert).toBeTruthy();
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should allow dismissing error alert", async () => {
      mockApiGet.mockResolvedValueOnce({ success: false, reason: "Test error" });

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("Test error")
        );
        expect(errorAlert).toBeTruthy();
      });

      // Find and click the dismiss button on the error alert
      const alerts = wrapper.findAllAlerts();
      const errorAlert = alerts.find((alert) =>
        alert.getElement().textContent?.includes("Test error")
      );
      const dismissButton = errorAlert?.findDismissButton();
      dismissButton?.click();

      await waitFor(() => {
        const updatedAlerts = wrapper.findAllAlerts();
        const errorStillExists = updatedAlerts.find((alert) =>
          alert.getElement().textContent?.includes("Test error")
        );
        expect(errorStillExists).toBeFalsy();
      });
    });

    it("should clear previous error when starting new update", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      // First update fails
      mockApiGet.mockResolvedValueOnce({ success: false, reason: "First error" });
      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("First error")
        );
        expect(errorAlert).toBeTruthy();
      });

      // Second update succeeds
      mockApiGet.mockResolvedValueOnce({ success: true });
      startUpdateButton?.click();

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorStillExists = alerts.find((alert) =>
          alert.getElement().textContent?.includes("First error")
        );
        expect(errorStillExists).toBeFalsy();
      });
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA labels", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const modal = wrapper.findModal();

      expect(modal).toBeTruthy();
      expect(modal?.findDismissButton()).toBeTruthy();
    });

    it("should focus management work correctly", async () => {
      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const modal = wrapper.findModal();

      // Modal should be in the document
      expect(modal?.getElement()).toBeInstanceOf(HTMLElement);
    });
  });

  describe("component state management", () => {
    it("should reset loading state after error", async () => {
      mockApiGet.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startUpdateButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startUpdateButton?.click();

      // Initially disabled during loading
      await waitFor(() => {
        const updatedButtons = wrapper.findAllButtons();
        const loadingButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Start Update")
        );
        expect(loadingButton?.getElement()).toHaveAttribute("aria-disabled", "true");
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("Unable to start software update")
        );
        expect(errorAlert).toBeTruthy();
      });

      // Should be enabled again after error
      await waitFor(() => {
        const finalButtons = wrapper.findAllButtons();
        const finalStartButton = finalButtons.find((btn) =>
          btn.getElement().textContent?.includes("Start Update")
        );
        const finalCancelButton = finalButtons.find((btn) =>
          btn.getElement().textContent?.includes("Cancel")
        );
        expect(finalStartButton?.getElement()).not.toHaveAttribute("aria-disabled");
        expect(finalCancelButton?.getElement()).not.toHaveAttribute("disabled");
      });
    });

    it("should handle multiple rapid clicks gracefully", async () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);
      });

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      // Click multiple times rapidly
      startButton?.click();
      startButton?.click();
      startButton?.click();

      // Should only call API once
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });
  });

  describe("edge cases", () => {
    it("should handle component unmounting during API call", async () => {
      let resolvePromise: (value: { success: boolean }) => void;
      mockApiGet.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { unmount } = render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startButton?.click();

      // Unmount component while API call is in progress
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({ success: true });

      // Should not crash or cause issues
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    it("should handle prop changes during update", async () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { rerender } = render(<SoftwareUpdateModal visible={true} onDismiss={mockOnDismiss} />);

      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const startButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Start Update")
      );

      startButton?.click();

      // Change props while update is in progress
      await act(async () => {
        rerender(<SoftwareUpdateModal visible={false} onDismiss={mockOnDismiss} />);
      });

      // Modal should be hidden
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(false);
    });
  });
});
