import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { LedColorContainer } from "../../../components/settings/led-color-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the validation utils
vi.mock("../../../components/settings/validation-utils", () => ({
  getColorRgb: vi.fn(),
}));

// Mock the color circle component
vi.mock("@uiw/react-color-circle", () => ({
  default: ({
    onChange,
    color,
    colors,
  }: {
    onChange: (color: { hex: string; rgb: { r: number; g: number; b: number } }) => void;
    color: string;
    colors: string[];
  }) => (
    <div data-testid="color-circle" data-color={color}>
      {colors.map((colorOption, index) => (
        <button
          key={index}
          data-testid={`color-option-${colorOption}`}
          onClick={() =>
            onChange({
              hex: colorOption,
              rgb: { r: 255, g: 0, b: 0 }, // Mock RGB values
            })
          }
        >
          {colorOption}
        </button>
      ))}
    </div>
  ),
}));

const mockApiHelper = vi.mocked(ApiHelper);
const mockGetColorRgb = vi.mocked(
  await import("../../../components/settings/validation-utils")
).getColorRgb;

describe("LedColorContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid test output noise
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockCalibrationResponse = {
    success: true,
  };

  const mockLedColorResponse = {
    success: true,
    red: 255,
    green: 0,
    blue: 0,
  };

  describe("Component Rendering", () => {
    it("renders the LED Color container with data and controls", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockCalibrationResponse) // set_calibration_mode
        .mockResolvedValueOnce(mockLedColorResponse); // get_led_color
      mockGetColorRgb.mockReturnValue("#FF0000");

      const { container } = await act(async () => {
        return render(<LedColorContainer />);
      });

      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Check header
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("LED colour");

      // Wait for API calls to complete
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("set_calibration_mode");
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_led_color");
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Check that color conversion function was called
      await waitFor(() => {
        expect(mockGetColorRgb).toHaveBeenCalledWith({ r: 255, g: 0, b: 0 });
      });

      // Check that the color circle is rendered with the correct color
      await waitFor(() => {
        const colorCircle = container.querySelector('[data-testid="color-circle"]');
        expect(colorCircle).toBeTruthy();
        expect(colorCircle?.getAttribute("data-color")).toBe("#FF0000");
      });

      // Check that the Turn Off LED button is present
      const buttons = wrapper.findAllButtons();
      const turnOffButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Turn Off LED")
      );
      expect(turnOffButton).toBeTruthy();
    });

    it("renders with default black color when calibration mode fails", async () => {
      mockApiHelper.get.mockResolvedValue({ success: false }); // Calibration mode fails

      const { container } = await act(async () => {
        return render(<LedColorContainer />);
      });

      const wrapper = createWrapper(container);

      // Check for the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("set_calibration_mode");
        expect(mockApiHelper.get).toHaveBeenCalledTimes(1); // Only calibration call, no LED data call
      });

      // Check that the color circle is rendered with default black color
      await waitFor(() => {
        const colorCircle = container.querySelector('[data-testid="color-circle"]');
        expect(colorCircle).toBeTruthy();
        expect(colorCircle?.getAttribute("data-color")).toBe("#000000");
      });

      // getColorRgb should not have been called since calibration failed
      expect(mockGetColorRgb).not.toHaveBeenCalled();
    });

    it("renders with default black color when LED data fetch fails", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockCalibrationResponse) // set_calibration_mode succeeds
        .mockResolvedValueOnce({ success: false }); // get_led_color fails

      const { container } = await act(async () => {
        return render(<LedColorContainer />);
      });

      // Wait for API calls to complete
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledWith("set_calibration_mode");
        expect(mockApiHelper.get).toHaveBeenCalledWith("get_led_color");
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Check that the color circle is rendered with default black color
      await waitFor(() => {
        const colorCircle = container.querySelector('[data-testid="color-circle"]');
        expect(colorCircle).toBeTruthy();
        expect(colorCircle?.getAttribute("data-color")).toBe("#000000");
      });

      // getColorRgb should not have been called since LED data fetch failed
      expect(mockGetColorRgb).not.toHaveBeenCalled();
    });
  });

  describe("Button Interactions", () => {
    it("turns off LED when Turn Off LED button is clicked", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockCalibrationResponse)
        .mockResolvedValueOnce(mockLedColorResponse);
      mockGetColorRgb.mockReturnValue("#FF0000");
      mockApiHelper.post.mockResolvedValue({ success: true });

      const { container } = await act(async () => {
        return render(<LedColorContainer />);
      });

      const wrapper = createWrapper(container);

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Find and click the Turn Off LED button
      const buttons = wrapper.findAllButtons();
      const turnOffButton = buttons.find((btn) =>
        btn.getElement().textContent?.includes("Turn Off LED")
      );

      expect(turnOffButton).toBeTruthy();
      turnOffButton?.click();

      // Verify POST API call is made with RGB (0,0,0)
      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith("set_led_color", {
          red: 0,
          green: 0,
          blue: 0,
        });
      });

      // Verify color is set to black
      await waitFor(() => {
        const colorCircle = container.querySelector('[data-testid="color-circle"]');
        expect(colorCircle?.getAttribute("data-color")).toBe("#000000");
      });
    });

    it("sets LED color when a color is selected from the color circle", async () => {
      mockApiHelper.get
        .mockResolvedValueOnce(mockCalibrationResponse)
        .mockResolvedValueOnce(mockLedColorResponse);
      mockGetColorRgb.mockReturnValue("#FF0000");
      mockApiHelper.post.mockResolvedValue({ success: true });

      const { container } = await act(async () => {
        return render(<LedColorContainer />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(mockApiHelper.get).toHaveBeenCalledTimes(2);
      });

      // Find and click a color option (blue)
      const blueColorButton = container.querySelector('[data-testid="color-option-#0000FF"]');
      expect(blueColorButton).toBeTruthy();

      // Click the blue color option
      await act(async () => {
        blueColorButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      // Verify POST API call is made with the selected color RGB values
      await waitFor(() => {
        expect(mockApiHelper.post).toHaveBeenCalledWith("set_led_color", {
          red: 255, // From our mock RGB values
          green: 0,
          blue: 0,
        });
      });

      // Verify color is updated in the UI
      await waitFor(() => {
        const colorCircle = container.querySelector('[data-testid="color-circle"]');
        expect(colorCircle?.getAttribute("data-color")).toBe("#0000FF");
      });
    });
  });
});
