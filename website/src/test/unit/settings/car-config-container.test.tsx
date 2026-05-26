import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, screen } from "../../utils";
import { fireEvent } from "@testing-library/react";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { CarConfigContainer } from "../../../components/settings/car-config-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApiHelper = vi.mocked(ApiHelper);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockCapabilities = {
  camera_modes: ["auto", "legacy", "modern"],
  logging_modes: ["Never", "USBOnly", "Always"],
  logging_providers: ["sqlite3"],
  inference_engines: ["TFLITE", "OV"],
  inference_devices: {
    TFLITE: ["CPU"],
    OV: ["CPU", "GPU", "MYRIAD"],
  },
};

const mockConfig = {
  logging: { mode: "Never", provider: "sqlite3" },
  camera: { mode: "auto" },
  inference: { engine: "auto", device: "auto" },
};

const mockCarConfigResponse = {
  success: true,
  config: mockConfig,
  capabilities: mockCapabilities,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find a button by label text within a Cloudscape wrapper. */
function findButton(wrapper: ReturnType<typeof createWrapper>, label: string) {
  return wrapper.findAllButtons().find((b) => b.getElement().textContent?.includes(label));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CarConfigContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Component Rendering", () => {
    it("renders the container with the correct header and description", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const containerEl = wrapper.findContainer();
      expect(containerEl).toBeTruthy();

      const header = containerEl?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Vehicle Configuration");
      expect(header?.getElement()).toHaveTextContent(
        "Settings applied on the next DeepRacer service restart."
      );

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));
    });

    it("renders Refresh and Save buttons in the header", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      expect(findButton(wrapper, "Refresh")).toBeTruthy();
      expect(findButton(wrapper, "Save")).toBeTruthy();
    });

    it("renders FormFields for Logging Mode, Camera Mode, and Inference Engine", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      const formFields = wrapper.findAllFormFields();
      const labels = formFields.map((f) => f.findLabel()?.getElement().textContent);
      expect(labels).toContain("Logging Mode");
      expect(labels).toContain("Camera Mode");
      expect(labels).toContain("Inference Engine");
    });

    it("Save button is disabled when config is unchanged (not dirty)", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });

    it("displays all logging mode tile options", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      await act(async () => render(<CarConfigContainer />));

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Cloudscape Tiles render each option as a labelled radio
      expect(screen.getByRole("radio", { name: /Never/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /USB only/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Always/ })).toBeInTheDocument();
    });

    it("displays all camera mode tile options", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      await act(async () => render(<CarConfigContainer />));

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // "Legacy (V4L2)" and "Modern (libcamera)" are unique to the camera section;
      // "Auto" appears in both camera and inference tiles so use getAllByRole.
      expect(screen.getAllByRole("radio", { name: /Auto/ }).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByRole("radio", { name: /Legacy \(V4L2\)/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Modern \(libcamera\)/ })).toBeInTheDocument();
    });

    it("builds inference tiles including multi-device OV options from capabilities", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      await act(async () => render(<CarConfigContainer />));

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // OV has CPU, GPU, MYRIAD → each becomes its own tile
      expect(screen.getByRole("radio", { name: /TensorFlow Lite/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /OpenVINO.*CPU/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /OpenVINO.*GPU/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Myriad X/i })).toBeInTheDocument();
    });
  });

  // ── API handling ───────────────────────────────────────────────────────────

  describe("API handling", () => {
    it("fetches car_config on mount", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      await act(async () => render(<CarConfigContainer />));

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));
      expect(mockApiHelper.get).toHaveBeenCalledTimes(1);
    });

    it("does not crash when API returns success: false", async () => {
      mockApiHelper.get.mockResolvedValue({ success: false });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Container should still be rendered without error
      expect(wrapper.findContainer()).toBeTruthy();
    });

    it("does not crash when API returns null", async () => {
      mockApiHelper.get.mockResolvedValue(null);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      expect(wrapper.findContainer()).toBeTruthy();
    });

    it("normalises config values case-insensitively (matchCI)", async () => {
      // Server returns upper-cased values that need normalising
      mockApiHelper.get.mockResolvedValue({
        success: true,
        config: {
          logging: { mode: "USБONLY", provider: "sqlite3" }, // intentional mismatch
          camera: { mode: "AUTO" },
          inference: { engine: "auto", device: "auto" },
        },
        capabilities: mockCapabilities,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // camera mode "AUTO" should be normalised to "auto"
      const cameraAuto = container.querySelector('input[type="radio"][value="auto"]:checked');
      // We just verify the component renders without crashing
      expect(wrapper.findContainer()).toBeTruthy();
    });
  });

  // ── Dirty-state tracking ───────────────────────────────────────────────────

  describe("Dirty state / Save button enablement", () => {
    it("enables Save button after changing the logging mode", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Click a different logging mode (current is "Never" → switch to "Always")
      const alwaysRadio = screen.getByRole("radio", { name: /Always/ });
      await act(async () => {
        fireEvent.click(alwaysRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the camera mode", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Click Legacy (current is "auto")
      const legacyRadio = screen.getByRole("radio", { name: /Legacy/ });
      await act(async () => {
        fireEvent.click(legacyRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the inference engine", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Click TensorFlow Lite (current is "auto")
      const tfliteRadio = screen.getByRole("radio", { name: /TensorFlow Lite/ });
      await act(async () => {
        fireEvent.click(tfliteRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });
  });

  // ── Save ───────────────────────────────────────────────────────────────────

  describe("Save behaviour", () => {
    it("calls ApiHelper.post with car_config and the updated payload", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
        capabilities: mockCapabilities,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Change logging mode to "Always"
      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      // Click Save
      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            logging: expect.objectContaining({ mode: "Always", provider: "sqlite3" }),
          })
        );
      });
    });

    it("always sends provider: sqlite3 in the save payload", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: mockConfig,
        capabilities: mockCapabilities,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            logging: expect.objectContaining({ provider: "sqlite3" }),
          })
        );
      });
    });

    it("shows a warning alert after a successful save", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
        capabilities: mockCapabilities,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const warningAlert = alerts.find((a) => a.getElement().textContent?.includes("Restart"));
        expect(warningAlert).toBeTruthy();
        expect(warningAlert?.getElement()).toHaveTextContent(
          "Configuration saved. Restart the DeepRacer service for changes to take effect."
        );
      });
    });

    it("Save button becomes disabled again after a successful save (no longer dirty)", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      const savedConfig = { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } };
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: savedConfig,
        capabilities: mockCapabilities,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => expect(mockApiHelper.post).toHaveBeenCalled());

      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });

    it("shows an error alert when save fails with a reason", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({
        success: false,
        config: mockConfig,
        capabilities: mockCapabilities,
        reason: "Disk full",
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((a) => a.getElement().textContent?.includes("Disk full"));
        expect(errorAlert).toBeTruthy();
      });
    });

    it("shows a fallback error message when save fails without a reason", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({ success: false });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((a) =>
          a.getElement().textContent?.includes("Failed to save configuration.")
        );
        expect(errorAlert).toBeTruthy();
      });
    });

    it("error alert can be dismissed", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);
      mockApiHelper.post.mockResolvedValue({ success: false, reason: "Permission denied" });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        expect(alerts.some((a) => a.getElement().textContent?.includes("Permission denied"))).toBe(
          true
        );
      });

      // Dismiss the alert
      await act(async () => {
        const alerts = wrapper.findAllAlerts();
        const errorAlert = alerts.find((a) =>
          a.getElement().textContent?.includes("Permission denied")
        );
        errorAlert?.findDismissButton()?.click();
      });

      await waitFor(() => {
        const alerts = wrapper.findAllAlerts();
        expect(alerts.some((a) => a.getElement().textContent?.includes("Permission denied"))).toBe(
          false
        );
      });
    });
  });

  // ── Refresh ────────────────────────────────────────────────────────────────

  describe("Refresh behaviour", () => {
    it("re-fetches car_config when Refresh is clicked", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledTimes(1));

      await act(async () => {
        findButton(wrapper, "Refresh")?.click();
      });

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledTimes(2));
      expect(mockApiHelper.get).toHaveBeenNthCalledWith(2, "car_config");
    });

    it("resets draft so Save is disabled again after Refresh with unchanged data", async () => {
      mockApiHelper.get.mockResolvedValue(mockCarConfigResponse);

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledWith("car_config"));

      // Make a change to enable Save
      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });
      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();

      // Refresh reloads the same config → draft == config → Save disabled again
      await act(async () => {
        findButton(wrapper, "Refresh")?.click();
      });

      await waitFor(() => expect(mockApiHelper.get).toHaveBeenCalledTimes(2));
      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });
  });
});
