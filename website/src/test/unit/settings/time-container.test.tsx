import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, expectKeyValuePair } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { TimeContainer } from "../../../components/settings/time-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApiHelper = vi.mocked(ApiHelper);

describe("TimeContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Intl.DateTimeFormat for consistent browser timezone
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
      resolvedOptions: () => ({ timeZone: "America/New_York" }),
    } as Intl.DateTimeFormat);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockTimeResponse = {
    success: true,
    time: "2025-07-19 14:30:00",
    timezone: "UTC",
    timezone_abbr: "UTC",
    utc_offset: "+00:00",
    timezone_changed: false,
  };

  describe("Component Rendering", () => {
    it("renders the Time container with data and enabled buttons", async () => {
      mockApiHelper.get.mockResolvedValue(mockTimeResponse);

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Check header
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Time & Timezone");
      expect(header?.getElement()).toHaveTextContent(
        "Current time and timezone settings for the AWS DeepRacer vehicle."
      );

      // Wait for API call to complete and data to be loaded
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Check that key-value pairs are displayed with the fetched data
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Current Car Time", "2025-07-19 14:30:00");
        expectKeyValuePair(keyValuePairs!, "Car Timezone", "UTC (UTC, +00:00)");
        expectKeyValuePair(keyValuePairs!, "Browser Timezone", "America/New_York");
      });

      // Check that buttons are present and enabled
      const buttons = wrapper.findAllButtons();
      expect(buttons).toHaveLength(2);

      const refreshButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Refresh")
      );
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(refreshButton).toBeTruthy();
      expect(setBrowserTimezoneButton).toBeTruthy();

      // Both buttons should be enabled since timezone_changed is false
      // and car timezone (UTC) differs from browser timezone (America/New_York)
      expect(refreshButton?.getElement()).not.toBeDisabled();
      expect(setBrowserTimezoneButton?.getElement()).not.toBeDisabled();
    });

    it("disables the Set to Browser Timezone button when timezones are the same", async () => {
      const mockSameTimezoneResponse = {
        success: true,
        time: "2025-07-19 14:30:00",
        timezone: "America/New_York",
        timezone_abbr: "EST",
        utc_offset: "-05:00",
        timezone_changed: false,
      };

      mockApiHelper.get.mockResolvedValue(mockSameTimezoneResponse);

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for API call to complete and data to be loaded
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Check that key-value pairs show the same timezone
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeTruthy();

        expectKeyValuePair(keyValuePairs!, "Current Car Time", "2025-07-19 14:30:00");
        expectKeyValuePair(keyValuePairs!, "Car Timezone", "America/New_York (EST, -05:00)");
        expectKeyValuePair(keyValuePairs!, "Browser Timezone", "America/New_York");
      });

      // Check that buttons are present but Set to Browser Timezone is disabled
      const buttons = wrapper.findAllButtons();
      expect(buttons).toHaveLength(2);

      const refreshButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Refresh")
      );
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(refreshButton).toBeTruthy();
      expect(setBrowserTimezoneButton).toBeTruthy();

      // Refresh button should be enabled, but Set to Browser Timezone should be disabled
      // since the timezones are the same
      expect(refreshButton?.getElement()).not.toBeDisabled();
      expect(setBrowserTimezoneButton?.getElement()).toBeDisabled();
    });

    it("shows initial state before get_time API call completes", async () => {
      // Create a promise that we can control to delay the API response
      let resolveApiCall: (value: typeof mockTimeResponse) => void;
      const apiPromise = new Promise<typeof mockTimeResponse>((resolve) => {
        resolveApiCall = resolve;
      });

      mockApiHelper.get.mockReturnValue(apiPromise);

      const { container } = render(<TimeContainer />);
      const wrapper = createWrapper(container);

      // Check that the component renders immediately with default values
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Header should be present
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Time & Timezone");

      // Check initial key-value pairs with default "Unknown" values
      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();

      expectKeyValuePair(keyValuePairs!, "Current Car Time", "Unknown");
      expectKeyValuePair(keyValuePairs!, "Car Timezone", "Unknown");
      expectKeyValuePair(keyValuePairs!, "Browser Timezone", "America/New_York");

      // Check that buttons are present
      const buttons = wrapper.findAllButtons();
      expect(buttons).toHaveLength(2);

      const refreshButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Refresh")
      );
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(refreshButton).toBeTruthy();
      expect(setBrowserTimezoneButton).toBeTruthy();

      // Set to Browser Timezone button should be enabled initially
      // since timezone_changed is false (default) and "Unknown" !== "America/New_York"
      expect(refreshButton?.getElement()).not.toBeDisabled();
      expect(setBrowserTimezoneButton?.getElement()).not.toBeDisabled();

      // Now resolve the API call to complete the test
      resolveApiCall!(mockTimeResponse);

      // Wait for the component to update with real data
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });
    });

    it("shows alert instead of key-value pairs when timezone_changed is true", async () => {
      const mockTimezoneChangedResponse = {
        success: true,
        time: "2025-07-19 14:30:00",
        timezone: "UTC",
        timezone_abbr: "UTC",
        utc_offset: "+00:00",
        timezone_changed: true, // This triggers the alert display
      };

      mockApiHelper.get.mockResolvedValue(mockTimezoneChangedResponse);

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Check that key-value pairs are NOT displayed when timezone_changed is true
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expect(keyValuePairs).toBeFalsy();
      });

      // Check that the alert is displayed instead
      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        expect(alerts).toHaveLength(1);

        const alert = alerts[0];
        expect(alert.getElement()).toHaveTextContent(
          "Timezone changed. Reset DeepRacer for changes to take effect."
        );
      });

      // Check that buttons are still present
      const buttons = wrapper.findAllButtons();
      expect(buttons).toHaveLength(2);

      // Set to Browser Timezone button should be disabled when timezone_changed is true
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );
      expect(setBrowserTimezoneButton?.getElement()).toBeDisabled();
    });
  });

  describe("Button Interactions", () => {
    it("calls get_time API again when refresh button is clicked", async () => {
      const updatedTimeResponse = {
        success: true,
        time: "2025-07-19 15:45:00", // Different time value
        timezone: "UTC",
        timezone_abbr: "UTC",
        utc_offset: "+00:00",
        timezone_changed: false,
      };

      // First call returns initial time, second call returns updated time
      mockApiHelper.get
        .mockResolvedValueOnce(mockTimeResponse)
        .mockResolvedValueOnce(updatedTimeResponse);

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial API call to complete and verify initial time is displayed
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
        expect(mockApiHelper.get).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expectKeyValuePair(keyValuePairs!, "Current Car Time", "2025-07-19 14:30:00");
      });

      // Find and click the refresh button
      const buttons = wrapper.findAllButtons();
      const refreshButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Refresh")
      );

      expect(refreshButton).toBeTruthy();

      // Click the refresh button using wrapper
      refreshButton?.click();

      // Verify that get_time API is called again and updated time is displayed
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Verify the updated time value is displayed
      await waitFor(() => {
        const keyValuePairs = wrapper.findKeyValuePairs();
        expectKeyValuePair(keyValuePairs!, "Current Car Time", "2025-07-19 15:45:00");
      });
    });

    it("successfully sets timezone to browser timezone", async () => {
      // Initial response shows different timezone
      const initialResponse = {
        success: true,
        time: "2025-07-19 14:30:00",
        timezone: "UTC",
        timezone_abbr: "UTC",
        utc_offset: "+00:00",
        timezone_changed: false,
      };

      // Response after timezone change shows updated data
      const updatedResponse = {
        success: true,
        time: "2025-07-19 10:30:00", // Time adjusted for new timezone
        timezone: "America/New_York",
        timezone_abbr: "EST",
        utc_offset: "-05:00",
        timezone_changed: false,
      };

      mockApiHelper.get
        .mockResolvedValueOnce(initialResponse)
        .mockResolvedValueOnce(updatedResponse);
      mockApiHelper.post.mockResolvedValue({ success: true });

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Find and click the Set to Browser Timezone button
      const buttons = wrapper.findAllButtons();
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(setBrowserTimezoneButton).toBeTruthy();
      expect(setBrowserTimezoneButton?.getElement()).not.toBeDisabled();

      // Click the button
      setBrowserTimezoneButton?.click();

      // Verify POST API call is made
      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith("set_timezone", {
          timezone: "America/New_York",
        });
      });

      // Verify get_time is called again to refresh data
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Verify success alert is shown
      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const successAlert = alerts.find((alert) =>
          alert
            .getElement()
            .textContent?.includes("Timezone was updated successfully to America/New_York")
        );
        expect(successAlert).toBeTruthy();
      });
    });

    it("shows error when timezone change fails", async () => {
      mockApiHelper.get.mockResolvedValue(mockTimeResponse);
      mockApiHelper.post.mockResolvedValue({ success: false }); // Failed POST

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Find and click the Set to Browser Timezone button
      const buttons = wrapper.findAllButtons();
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(setBrowserTimezoneButton).toBeTruthy();
      setBrowserTimezoneButton?.click();

      // Verify POST API call is made
      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith("set_timezone", {
          timezone: "America/New_York",
        });
      });

      // Verify error alert is shown
      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((alert) =>
          alert.getElement().textContent?.includes("Failed to update timezone. Please try again.")
        );
        expect(errorAlert).toBeTruthy();
      });
    });

    it("shows loading state when timezone change is in progress", async () => {
      // Create a promise we can control to simulate loading
      let resolvePostCall: (value: { success: boolean }) => void;
      const postPromise = new Promise<{ success: boolean }>((resolve) => {
        resolvePostCall = resolve;
      });

      mockApiHelper.get.mockResolvedValue(mockTimeResponse);
      mockApiHelper.post.mockReturnValue(postPromise);

      const { container } = await act(async () => {
        return render(<TimeContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_time");
      });

      // Find and click the Set to Browser Timezone button
      const buttons = wrapper.findAllButtons();
      const setBrowserTimezoneButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Set to Browser Timezone")
      );

      expect(setBrowserTimezoneButton).toBeTruthy();
      setBrowserTimezoneButton?.click();

      // Verify button shows loading state
      await waitFor(() => {
        const updatedButtons = wrapper.findAllButtons();
        const loadingButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Set to Browser Timezone")
        );
        expect(loadingButton?.getElement()).toBeDisabled();
      });

      // Resolve the POST call
      resolvePostCall!({ success: true });

      // Wait for loading to complete
      await waitFor(() => {
        const updatedButtons = wrapper.findAllButtons();
        const completedButton = updatedButtons.find((btn) =>
          btn.getElement().textContent?.includes("Set to Browser Timezone")
        );
        expect(completedButton?.getElement()).not.toBeDisabled();
      });
    });
  });
});
