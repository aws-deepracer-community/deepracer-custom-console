import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { CameraSettingsContainer } from "../../../components/settings/camera-settings-container";
import { CameraParameter } from "../../../common/types";

const mockUseCamera = vi.fn();
vi.mock("../../../common/hooks/use-camera", () => ({
  useCamera: () => mockUseCamera(),
}));

const CAMERA_FEED =
  "route?topic=/camera_pkg/display_mjpeg&width=480&height=360&qos_profile=sensor_data";

const parameters: CameraParameter[] = [
  {
    name: "ExposureTime",
    type: "integer",
    value: 1000,
    min: 1,
    max: 20000,
    step: 1,
    description: "Exposure duration in microseconds.",
  },
  {
    name: "AeEnable",
    type: "boolean",
    value: false,
    description: "Automatic exposure.",
  },
  {
    name: "ColourGains",
    type: "double_array",
    value: [1.5, 1.2],
    description: "Red and blue gains.",
  },
];

const mockRefresh = vi.fn();
const mockSetParameter = vi.fn();

function cameraState(overrides = {}) {
  return {
    parameters,
    isLoading: false,
    error: null,
    refresh: mockRefresh,
    setParameter: mockSetParameter,
    ...overrides,
  };
}

describe("CameraSettingsContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetParameter.mockResolvedValue({ success: true });
    mockUseCamera.mockReturnValue(cameraState());
  });

  it("renders a live camera preview with the display MJPEG stream", () => {
    const { container } = render(<CameraSettingsContainer />);

    expect(container.querySelector("img[alt='Live camera preview']")).toHaveAttribute(
      "src",
      CAMERA_FEED
    );
  });

  it("renders slider, toggle, and array controls from parameter metadata", () => {
    const { container } = render(<CameraSettingsContainer />);
    const wrapper = createWrapper(container);

    expect(wrapper.findSlider()).toBeTruthy();
    expect(wrapper.findToggle()).toBeTruthy();
    expect(screen.getByLabelText("Colour Gains value 1")).toHaveValue("1.5");
    expect(screen.getByLabelText("Colour Gains value 2")).toHaveValue("1.2");
  });

  it("shows a loading indicator while parameters are loading", () => {
    mockUseCamera.mockReturnValue(cameraState({ parameters: [], isLoading: true }));

    const { container } = render(<CameraSettingsContainer />);

    expect(createWrapper(container).findSpinner()).toBeTruthy();
  });

  it("shows an error returned by the camera hook", () => {
    mockUseCamera.mockReturnValue(cameraState({ parameters: [], error: "Camera is unavailable." }));

    const { container } = render(<CameraSettingsContainer />);
    const wrapper = createWrapper(container);

    expect(wrapper.findAlert()).toBeTruthy();
    expect(wrapper.findAlert()?.getElement()).toHaveTextContent("Camera is unavailable.");
  });

  it("applies boolean changes and shows save feedback", async () => {
    render(<CameraSettingsContainer />);

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(mockSetParameter).toHaveBeenCalledWith("AeEnable", true);
    });
    expect(screen.getByText("AE Enable updated.")).toBeTruthy();
  });

  it("shows the error returned when a parameter update is rejected", async () => {
    mockSetParameter.mockResolvedValue({ success: false, message: "Camera rejected the change." });
    render(<CameraSettingsContainer />);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(await screen.findByText("Camera rejected the change.")).toBeTruthy();
  });

  it("falls back to a safe message when a rejected update has no message", async () => {
    mockSetParameter.mockResolvedValue({ success: false });
    render(<CameraSettingsContainer />);

    fireEvent.click(screen.getByRole("checkbox"));

    expect(await screen.findByText("Invalid camera parameter value.")).toBeTruthy();
  });

  it("formats numeric range descriptions with the correct minimum and maximum values", () => {
    mockUseCamera.mockReturnValue(
      cameraState({
        parameters: [
          {
            name: "AnalogueGain",
            type: "double",
            value: 1,
            min: 0.5,
            max: 1.51,
            step: 0.01,
            description: "Float scalar range {0.500000}..{1.510204} (default: {1.000000})",
          },
        ],
      })
    );

    const { container } = render(<CameraSettingsContainer />);

    expect(container.textContent).toContain("Range: 0.5 to 1.5 (default: 1.0)");
  });
});
