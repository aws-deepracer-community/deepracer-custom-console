import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { DeviceConsolePasswordContainer } from "../../../components/settings/device-console-password-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    post: vi.fn(),
  },
}));

// Mock validation utils
vi.mock("../../../components/settings/validation-utils", () => {
  // Use named exports that override the default error states
  const mockModule = {
    oldPasswordError: false,
    newPasswordError: false,
    confirmPasswordError: false,
    validateOldPassword: vi.fn(() => ""),
    validateNewPassword: vi.fn(() => ""),
    validateConfirmPassword: vi.fn(() => ""),
  };
  return mockModule;
});

describe("DeviceConsolePasswordContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render container with header and description", () => {
    const { container } = render(<DeviceConsolePasswordContainer />);
    const wrapper = createWrapper(container);

    // Find the container
    const containerComponent = wrapper.findContainer();
    expect(containerComponent).toBeTruthy();

    // Check header text and description
    const header = containerComponent?.findHeader();
    expect(header?.getElement()).toHaveTextContent("Device console password");
    expect(header?.getElement()).toHaveTextContent(
      "A password is required to protect access to your AWS DeepRacer vehicle."
    );

    // Check the change password button in header
    const changePasswordButton = wrapper.findButton();
    expect(changePasswordButton?.getElement()).toHaveTextContent("Change Device Console Password");
  });

  it("should display reset password link", () => {
    const { container } = render(<DeviceConsolePasswordContainer />);

    // Check for reset password link
    const link = container.querySelector('a[href*="reset-your-password"]');
    expect(link).toBeTruthy();
    expect(link).toHaveAttribute("target", "_blank");
    expect(link?.textContent).toContain("reset your password");
  });

  it("should open modal when change password button is clicked", async () => {
    render(<DeviceConsolePasswordContainer />);
    const wrapper = createWrapper(document.body);
    const modalWrapper = wrapper.findModal()!;

    // Find the button using the container wrapper
    const containerWrapper = createWrapper(document.body);
    const changePasswordButton = containerWrapper.findButton();
    expect(changePasswordButton).toBeTruthy();

    // Initially modal should not be visible
    expect(modalWrapper.isVisible()).toBe(false);

    // Click the change password button
    changePasswordButton?.click();

    // Check that modal becomes visible
    await waitFor(() => {
      expect(modalWrapper.isVisible()).toBe(true);
    });

    // Check modal content
    expect(modalWrapper.findHeader().getElement()).toHaveTextContent("Change Device Password");
  });

  it("should show three password inputs in modal", async () => {
    render(<DeviceConsolePasswordContainer />);
    const wrapper = createWrapper(document.body);

    // Open modal
    const changePasswordButton = wrapper.findButton();
    changePasswordButton?.click();

    // Wait for modal and check inputs
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);

      // Find inputs from main wrapper - inputs should be visible when modal is open
      const inputs = wrapper.findAllInputs();
      expect(inputs.length).toBe(3); // old, new, confirm passwords
    });
  });

  it("should close modal when cancel button is clicked", async () => {
    render(<DeviceConsolePasswordContainer />);
    const wrapper = createWrapper(document.body);
    const modalWrapper = wrapper.findModal()!;

    // Open modal
    const changePasswordButton = wrapper.findButton();
    changePasswordButton?.click();

    // Wait for modal to open
    await waitFor(() => {
      expect(modalWrapper.isVisible()).toBe(true);
    });

    // Find and click cancel button - search all buttons
    const buttons = wrapper.findAllButtons();
    const cancelButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Cancel")
    );

    cancelButton?.click();

    // Wait for modal to close
    await waitFor(() => {
      expect(modalWrapper.isVisible()).toBe(false);
    });
  });

  it("should successfully change password with valid input", async () => {
    const mockApiPost = vi.mocked(ApiHelper.post);
    mockApiPost.mockResolvedValueOnce({ success: true });

    render(<DeviceConsolePasswordContainer />);
    const wrapper = createWrapper(document.body);

    // Open modal
    const changePasswordButton = wrapper.findButton();
    changePasswordButton?.click();

    // Wait for modal and fill in passwords
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);
    });

    const inputs = wrapper.findAllInputs();
    expect(inputs.length).toBe(3);

    // Set values
    inputs[0].setInputValue("oldpassword123");
    inputs[1].setInputValue("NewPassword123");
    inputs[2].setInputValue("NewPassword123");

    // Click change password button
    const buttons = wrapper.findAllButtons();
    const changePasswordSubmitButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change Password")
    );

    changePasswordSubmitButton?.click();

    // Verify API was called
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("password", {
        old_password: "oldpassword123",
        new_password: "NewPassword123",
      });
    });
  });
});
