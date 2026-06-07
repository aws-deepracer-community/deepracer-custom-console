import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act, screen } from "../../utils";
import { fireEvent } from "@testing-library/react";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { CarConfigContainer } from "../../../components/settings/car-config-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper – only ApiHelper.post is used by this component now
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock use-car-config – the component reads config/capabilities from context, not ApiHelper.get
const mockRefresh = vi.fn();
const mockUseCarConfig = vi.fn();
vi.mock("../../../common/hooks/use-car-config", () => ({
  useCarConfig: () => mockUseCarConfig(),
  CarConfigContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

const mockApiHelper = vi.mocked(ApiHelper);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockCapabilities = {
  camera_modes: ["auto", "legacy", "modern"],
  camera_orientations: [0, 180],
  logging_modes: ["Never", "USBOnly", "Always"],
  logging_providers: ["sqlite3"],
  inference_engines: ["TFLITE", "OV"],
  inference_devices: {
    TFLITE: ["CPU"],
    OV: ["CPU", "GPU", "MYRIAD"],
  },
  steering_modes: ["servo", "diffdrive"],
};

const mockConfig = {
  logging: { mode: "Never", provider: "sqlite3" },
  camera: { mode: "auto", orientation: 0 },
  inference: { engine: "auto", device: "auto" },
  steering: { mode: "servo" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Find a button by label text within a Cloudscape wrapper. */
function findButton(wrapper: ReturnType<typeof createWrapper>, label: string) {
  return wrapper.findAllButtons().find((b) => b.getElement().textContent?.includes(label));
}

const defaultContextValue = () => ({
  config: mockConfig,
  capabilities: mockCapabilities,
  isLoading: false,
  isGrayOverlaySupported: false,
  isGrayOverlayEnabled: false,
  refresh: mockRefresh,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CarConfigContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCarConfig.mockReturnValue(defaultContextValue());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Component Rendering", () => {
    it("renders four containers with section headers", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const containers = wrapper.findAllContainers();
      expect(containers.length).toBe(4);

      const headerTexts = containers.map((c) => c.findHeader()?.getElement().textContent ?? "");
      expect(headerTexts.some((t) => t.includes("Logging"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Camera"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Inference Engine"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Steering Mode"))).toBe(true);
    });

    it("renders Refresh and Save buttons in the header", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      expect(findButton(wrapper, "Refresh")).toBeTruthy();
      expect(findButton(wrapper, "Save")).toBeTruthy();
    });

    it("renders sections for Logging Mode, Camera Mode, Inference Engine, and Steering Mode", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const containers = wrapper.findAllContainers();
      const headerTexts = containers.map((c) => c.findHeader()?.getElement().textContent ?? "");
      expect(headerTexts.some((t) => t.includes("Logging"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Camera"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Inference Engine"))).toBe(true);
      expect(headerTexts.some((t) => t.includes("Steering Mode"))).toBe(true);
    });

    it("Save button is disabled when config is unchanged (not dirty)", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });

    it("displays all logging mode tile options", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByRole("radio", { name: /Never/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /USB only/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Always/ })).toBeInTheDocument();
    });

    it("displays all camera mode tile options", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(screen.getAllByRole("radio", { name: /Auto/ }).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByRole("radio", { name: /Legacy \(V4L2\)/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Modern \(libcamera\)/ })).toBeInTheDocument();
    });

    it("displays all steering mode tile options", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByRole("radio", { name: /Servo/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Differential Drive/ })).toBeInTheDocument();
    });

    it("hides the logging Provider sub-section when only one provider is available", async () => {
      // defaultContextValue has logging_providers: ["sqlite3"] (one provider)
      await act(async () => render(<CarConfigContainer />));

      expect(screen.queryByRole("radio", { name: /SQLite3/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: /MCAP/ })).not.toBeInTheDocument();
    });

    it("shows the logging Provider sub-section when multiple providers are available", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        capabilities: { ...mockCapabilities, logging_providers: ["sqlite3", "mcap"] },
      });

      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByRole("radio", { name: /SQLite3/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /MCAP/ })).toBeInTheDocument();
    });

    it("hides the Steering Mode container when only one steering mode is available", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        capabilities: { ...mockCapabilities, steering_modes: ["servo"] },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const headerTexts = wrapper
        .findAllContainers()
        .map((c) => c.findHeader()?.getElement().textContent ?? "");
      expect(headerTexts.some((t) => t.includes("Steering Mode"))).toBe(false);
    });

    it("builds inference tiles including multi-device OV options from capabilities", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByRole("radio", { name: /TensorFlow Lite/ })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /OpenVINO.*CPU/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /OpenVINO.*GPU/i })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Myriad X/i })).toBeInTheDocument();
    });

    it("hides camera rotation control when camera mode is auto", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(screen.queryByText("Camera rotation")).not.toBeInTheDocument();
    });

    it("shows camera rotation control when camera mode is modern", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: {
          ...mockConfig,
          camera: { mode: "modern", orientation: 0 },
        },
      });

      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByText("Camera rotation")).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /0 deg/ })).toBeInTheDocument();
    });

    it("hides camera rotation control when capability is not available", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: {
          ...mockConfig,
          camera: { mode: "modern", orientation: 0 },
        },
        capabilities: {
          ...mockCapabilities,
          camera_orientations: [],
        },
      });

      await act(async () => render(<CarConfigContainer />));

      expect(screen.queryByText("Camera rotation")).not.toBeInTheDocument();
    });
  });

  // ── API handling ───────────────────────────────────────────────────────────

  describe("API handling", () => {
    it("renders form with data from context without calling ApiHelper.get", async () => {
      await act(async () => render(<CarConfigContainer />));

      expect(mockApiHelper.get).not.toHaveBeenCalled();
      expect(screen.getByRole("radio", { name: /Never/ })).toBeInTheDocument();
    });

    it("does not crash when context config is null", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: null,
        capabilities: null,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      expect(wrapper.findContainer()).toBeTruthy();
    });

    it("normalises config values case-insensitively (matchCI)", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: {
          logging: { mode: "USBONLY", provider: "sqlite3" }, // intentional mismatch
          camera: { mode: "AUTO" },
          inference: { engine: "auto", device: "auto" },
          steering: { mode: "servo" },
        },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      // camera mode "AUTO" should be normalised to "auto" — just verify the component renders
      expect(container.querySelector('input[type="radio"][value="auto"]:checked')).toBeTruthy();
      expect(wrapper.findContainer()).toBeTruthy();
    });
  });

  // ── Dirty-state tracking ───────────────────────────────────────────────────

  describe("Dirty state / Save button enablement", () => {
    it("enables Save button after changing the logging mode", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const alwaysRadio = screen.getByRole("radio", { name: /Always/ });
      await act(async () => {
        fireEvent.click(alwaysRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the camera mode", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const legacyRadio = screen.getByRole("radio", { name: /Legacy/ });
      await act(async () => {
        fireEvent.click(legacyRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the inference engine", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const tfliteRadio = screen.getByRole("radio", { name: /TensorFlow Lite/ });
      await act(async () => {
        fireEvent.click(tfliteRadio);
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the logging provider", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        capabilities: { ...mockCapabilities, logging_providers: ["sqlite3", "mcap"] },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /MCAP/ }));
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("enables Save button after changing the steering mode", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Differential Drive/ }));
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });
  });

  // ── Save ───────────────────────────────────────────────────────────────────

  describe("Save behaviour", () => {
    it("calls ApiHelper.post with car_config and the updated payload", async () => {
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

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
            logging: expect.objectContaining({ mode: "Always", provider: "sqlite3" }),
          })
        );
      });
    });

    it("sends the updated logging provider in the save payload", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        capabilities: { ...mockCapabilities, logging_providers: ["sqlite3", "mcap"] },
      });
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Never", provider: "mcap" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /MCAP/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            logging: expect.objectContaining({ provider: "mcap" }),
          })
        );
      });
    });

    it("sends the steering mode in the save payload", async () => {
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, steering: { mode: "diffdrive" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Differential Drive/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            steering: { mode: "diffdrive" },
          })
        );
      });
    });

    it("sends camera.orientation 180 when camera rotation is enabled", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: {
          ...mockConfig,
          camera: { mode: "modern", orientation: 0 },
        },
      });
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, camera: { mode: "modern", orientation: 180 } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("checkbox", { name: /0 deg/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            camera: expect.objectContaining({ orientation: 180 }),
          })
        );
      });
    });

    it("resets camera.orientation to 0 when switching away from modern mode", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: {
          ...mockConfig,
          camera: { mode: "modern", orientation: 180 },
        },
      });
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, camera: { mode: "legacy", orientation: 0 } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Legacy/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            camera: expect.objectContaining({ mode: "legacy", orientation: 0 }),
          })
        );
      });
    });

    it("shows a warning alert after a successful save", async () => {
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

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
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => expect(mockApiHelper.post).toHaveBeenCalled());

      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });

    it("calls context refresh() after a successful save", async () => {
      mockApiHelper.post.mockResolvedValue({
        success: true,
        config: { ...mockConfig, logging: { mode: "Always", provider: "sqlite3" } },
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => expect(mockApiHelper.post).toHaveBeenCalled());

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows an error alert when save fails with a reason", async () => {
      mockApiHelper.post.mockResolvedValue({
        success: false,
        config: mockConfig,
        capabilities: mockCapabilities,
        reason: "Disk full",
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

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
      mockApiHelper.post.mockResolvedValue({ success: false });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

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
      mockApiHelper.post.mockResolvedValue({ success: false, reason: "Permission denied" });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

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

  // ── IMU ────────────────────────────────────────────────────────────────────

  describe("IMU section", () => {
    const mockCapabilitiesWithImu = {
      ...mockCapabilities,
      imu: true,
      imu_crash_thresholds: [0, 1.5, 2.0, 2.5, 3.0],
      imu_pickup_thresholds: [0, 0.5, 0.75, 0.95],
    };

    const mockConfigWithImu = {
      ...mockConfig,
      imu: { enabled: false, crash_threshold_g: 0, pickup_threshold_g: 0 },
    };

    it("does not render the IMU container when capabilities.imu is false", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const headerTexts = wrapper
        .findAllContainers()
        .map((c) => c.findHeader()?.getElement().textContent ?? "");
      expect(headerTexts.some((t) => t.includes("IMU"))).toBe(false);
    });

    it("renders the IMU container when capabilities.imu is true", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      const headerTexts = wrapper
        .findAllContainers()
        .map((c) => c.findHeader()?.getElement().textContent ?? "");
      expect(headerTexts.some((t) => t.includes("IMU"))).toBe(true);
    });

    it("shows Enable IMU toggle defaulting to off when config.imu.enabled is false", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });

      await act(async () => render(<CarConfigContainer />));

      expect(screen.getByText("Enable IMU")).toBeInTheDocument();
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("hides crash and pickup sliders when IMU is disabled", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });

      await act(async () => render(<CarConfigContainer />));

      expect(screen.queryByText("Crash Detection")).not.toBeInTheDocument();
      expect(screen.queryByText("Pickup Detection")).not.toBeInTheDocument();
    });

    it("shows crash and pickup sliders after toggling IMU on", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        wrapper.findToggle()?.findNativeInput().click();
      });

      expect(screen.getByText("Crash Detection")).toBeInTheDocument();
      expect(screen.getByText("Pickup Detection")).toBeInTheDocument();
    });

    it("enables Save after toggling IMU on", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        wrapper.findToggle()?.findNativeInput().click();
      });

      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();
    });

    it("sends imu section in save payload when IMU is enabled", async () => {
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilitiesWithImu,
      });
      mockApiHelper.post.mockResolvedValue({ success: true, config: mockConfigWithImu });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      // Toggle IMU on
      await act(async () => {
        wrapper.findToggle()?.findNativeInput().click();
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith(
          "car_config",
          expect.objectContaining({
            imu: expect.objectContaining({ enabled: true }),
          })
        );
      });
    });

    it("omits imu from save payload when capabilities.imu is absent (e.g. RPi)", async () => {
      // capabilities without imu flag — the component still builds imu defaults in the draft
      // but buildPayload() should strip the key before posting.
      mockUseCarConfig.mockReturnValue({
        ...defaultContextValue(),
        config: mockConfigWithImu,
        capabilities: mockCapabilities, // no imu flag
      });
      mockApiHelper.post.mockResolvedValue({ success: true, config: mockConfig });

      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      // Make any change to dirty the form
      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });

      await act(async () => {
        findButton(wrapper, "Save")?.click();
      });

      await waitFor(() => expect(mockApiHelper.post).toHaveBeenCalled());

      const postedPayload = mockApiHelper.post.mock.calls[0][1] as Record<string, unknown>;
      expect(postedPayload).not.toHaveProperty("imu");
    });
  });

  // ── Refresh ────────────────────────────────────────────────────────────────

  describe("Refresh behaviour", () => {
    it("calls context refresh() when Refresh is clicked", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      await act(async () => {
        findButton(wrapper, "Refresh")?.click();
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("resets draft so Save is disabled again after Refresh with unchanged data", async () => {
      const { container } = await act(async () => render(<CarConfigContainer />));
      const wrapper = createWrapper(container);

      // Make a change to enable Save
      await act(async () => {
        fireEvent.click(screen.getByRole("radio", { name: /Always/ }));
      });
      expect(findButton(wrapper, "Save")?.getElement()).not.toBeDisabled();

      // Refresh immediately discards local changes → draft == savedConfig → Save disabled
      await act(async () => {
        findButton(wrapper, "Refresh")?.click();
      });

      expect(findButton(wrapper, "Save")?.getElement()).toBeDisabled();
    });
  });
});
