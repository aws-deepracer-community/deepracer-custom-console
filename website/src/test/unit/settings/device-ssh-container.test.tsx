import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "../../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import { DeviceSshContainer } from "../../../components/settings/device-ssh-container";
import { ApiHelper } from "../../../common/helpers/api-helper";

// Mock ApiHelper
vi.mock("../../../common/helpers/api-helper", () => ({
  ApiHelper: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock validation utils
vi.mock("../../../components/settings/validation-utils", () => {
  // Create a mock module with mutable error states
  return {
    get oldPasswordError() {
      return false;
    },
    get newPasswordError() {
      return false;
    },
    get confirmPasswordError() {
      return false;
    },
    validateOldPassword: vi.fn(() => ""),
    validateNewPassword: vi.fn(() => ""),
    validateConfirmPassword: vi.fn(() => ""),
  };
});

describe("DeviceSshContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock default API responses
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: false });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render container with header and SSH status", async () => {
    const { container } = render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(container);

      // Find the container
      const containerComponent = wrapper.findContainer();
      expect(containerComponent).toBeTruthy();

      // Check header text
      const header = containerComponent?.findHeader();
      expect(header?.getElement()).toHaveTextContent("Device SSH");

      // Check for SSH status in KeyValuePairs
      const keyValuePairs = wrapper.findKeyValuePairs();
      expect(keyValuePairs).toBeTruthy();
    });
  });

  it("should display SSH control buttons in header", async () => {
    const { container } = render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(container);

      // Check for SSH control buttons
      const buttons = wrapper.findAllButtons();
      expect(buttons.length).toBeGreaterThanOrEqual(3);

      const buttonTexts = buttons.map((button) => button.getElement().textContent);
      expect(buttonTexts).toContain("Enable SSH");
      expect(buttonTexts).toContain("Disable SSH");
      expect(buttonTexts).toContain("Change SSH Password");
    });
  });

  it("should show correct SSH status when disabled", async () => {
    const { container } = render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(container);

      // Check SSH status indicator
      const statusIndicators = wrapper.findAllStatusIndicators();
      const sshStatusIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Not enabled")
      );
      expect(sshStatusIndicator).toBeTruthy();
    });
  });

  it("should show correct SSH status when enabled", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    const { container } = render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(container);

      // Check SSH status indicator
      const statusIndicators = wrapper.findAllStatusIndicators();
      const sshStatusIndicator = statusIndicators.find((indicator) =>
        indicator.getElement().textContent?.includes("Enabled")
      );
      expect(sshStatusIndicator).toBeTruthy();
    });
  });

  it("should enable SSH when enable button is clicked", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "enableSsh") {
        return Promise.resolve({ success: true });
      }
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: false }); // SSH disabled so enable button is available
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and find the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const enableButton = buttons.find(
        (button) =>
          button.getElement().textContent?.includes("Enable SSH") && !button.getElement().disabled
      );

      expect(enableButton).toBeTruthy();
      // Verify button is clickable and not disabled
      expect(enableButton?.getElement().disabled).toBe(false);
    });
  });

  it("should disable SSH when disable button is clicked", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "disableSsh") {
        return Promise.resolve({ success: true });
      }
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true }); // SSH should be enabled so disable button is clickable
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const disableButton = buttons.find(
        (button) =>
          button.getElement().textContent?.includes("Disable SSH") && !button.getElement().disabled
      );

      expect(disableButton).toBeTruthy();
      // Verify button is clickable and not disabled
      expect(disableButton?.getElement().disabled).toBe(false);
    });
  });

  it("should open modal when change SSH password button is clicked", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and find the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );

      expect(changePasswordButton).toBeTruthy();
      expect(changePasswordButton?.getElement()).not.toHaveAttribute("disabled");
    });

    // Click the button
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal to appear
    await waitFor(() => {
      const modalWrapper = wrapper.findModal();
      expect(modalWrapper).toBeTruthy();
      expect(modalWrapper!.isVisible()).toBe(true);
      expect(modalWrapper!.findHeader().getElement()).toHaveTextContent("Change SSH Password");
    });
  });

  it("should show password inputs in modal when default password not changed", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
      expect(changePasswordButton?.getElement()).not.toHaveAttribute("disabled");
    });

    // Click the button
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal and check inputs
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);

      // Should show 2 inputs (new password, confirm password) when default password not changed
      const inputs = wrapper.findAllInputs();
      expect(inputs.length).toBe(2); // new password + confirm password
    });

    // Should also have the "Show Passwords" checkbox
    const checkbox = wrapper.findCheckbox();
    expect(checkbox).toBeTruthy();
  });

  it("should show all password inputs in modal when default password changed", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: true });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
      expect(changePasswordButton?.getElement()).not.toHaveAttribute("disabled");
    });

    // Click the button
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal and check inputs
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);

      // Should show 3 inputs (old, new, confirm passwords) when default password changed
      const inputs = wrapper.findAllInputs();
      expect(inputs.length).toBe(3); // old password + new password + confirm password

      // Should also have the "Show Passwords" checkbox
      const checkbox = wrapper.findCheckbox();
      expect(checkbox).toBeTruthy();
    });
  });

  it("should close modal when cancel button is clicked", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
    });

    // Click the button to open modal
    let wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal to open
    await waitFor(() => {
      wrapper = createWrapper(document.body);
      const modalWrapper = wrapper.findModal()!;
      expect(modalWrapper.isVisible()).toBe(true);
    });

    // Find and click cancel button
    const allButtons = wrapper.findAllButtons();
    const cancelButton = allButtons.find((button) =>
      button.getElement().textContent?.includes("Cancel")
    );
    cancelButton?.click();

    // Wait for modal to close
    await waitFor(() => {
      wrapper = createWrapper(document.body);
      const modalWrapper = wrapper.findModal()!;
      expect(modalWrapper.isVisible()).toBe(false);
    });
  });

  it("should toggle password visibility when show passwords checkbox is clicked", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
    });

    // Click the button to open modal
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal and toggle checkbox
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);
    });

    // Find and click show passwords checkbox
    const checkbox = wrapper.findCheckbox();
    expect(checkbox).toBeTruthy();
    expect(checkbox?.getElement()).toHaveTextContent("Show Passwords");

    // Check the checkbox
    checkbox?.findNativeInput().click();
  });

  it("should successfully change SSH password with valid input for default password", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    const mockApiPost = vi.mocked(ApiHelper.post);

    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    mockApiPost.mockResolvedValueOnce({ success: true });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
    });

    // Click the button to open modal
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal and fill in passwords
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);
    });

    // Find inputs from main wrapper - inputs should be visible when modal is open
    const inputs = wrapper.findAllInputs();
    expect(inputs.length).toBe(2); // new password, confirm password

    // Set values (new password, confirm password)
    inputs[0].setInputValue("NewPassword123");
    inputs[1].setInputValue("NewPassword123");

    // Click change password button
    const allButtons = wrapper.findAllButtons();
    const changePasswordSubmitButton = allButtons.find((button) =>
      button.getElement().textContent?.includes("Change Password")
    );

    changePasswordSubmitButton?.click();

    // Verify API was called with default password
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("resetSshPassword", {
        oldPassword: "deepracer",
        newPassword: "NewPassword123",
      });
    });
  });

  it("should successfully change SSH password with valid input for custom password", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    const mockApiPost = vi.mocked(ApiHelper.post);

    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: true });
      }
      return Promise.resolve({ success: false });
    });

    mockApiPost.mockResolvedValueOnce({ success: true });

    render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
    });

    // Click the button to open modal
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    // Wait for modal and fill in passwords
    await waitFor(() => {
      const modal = wrapper.findModal();
      expect(modal?.isVisible()).toBe(true);
    });

    // Find inputs from main wrapper - inputs should be visible when modal is open
    const inputs = wrapper.findAllInputs();
    expect(inputs.length).toBe(3); // old, new, confirm passwords

    // Set values (old password, new password, confirm password)
    inputs[0].setInputValue("oldpassword123");
    inputs[1].setInputValue("NewPassword123");
    inputs[2].setInputValue("NewPassword123");

    // Click change password button
    const allButtons = wrapper.findAllButtons();
    const changePasswordSubmitButton = allButtons.find((button) =>
      button.getElement().textContent?.includes("Change Password")
    );

    changePasswordSubmitButton?.click();

    // Verify API was called with custom old password
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("resetSshPassword", {
        oldPassword: "oldpassword123",
        newPassword: "NewPassword123",
      });
    });
  });

  it("should display success alert after password change", async () => {
    const mockApiGet = vi.mocked(ApiHelper.get);
    const mockApiPost = vi.mocked(ApiHelper.post);

    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === "isSshEnabled") {
        return Promise.resolve({ success: true, isSshEnabled: true });
      }
      if (endpoint === "isSshDefaultPasswordChanged") {
        return Promise.resolve({ success: true, isDefaultSshPasswordChanged: false });
      }
      return Promise.resolve({ success: false });
    });

    mockApiPost.mockResolvedValueOnce({ success: true });

    const { container } = render(<DeviceSshContainer />);

    // Wait for component to load and click the button
    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const buttons = wrapper.findAllButtons();
      const changePasswordButton = buttons.find((button) =>
        button.getElement().textContent?.includes("Change SSH Password")
      );
      expect(changePasswordButton).toBeTruthy();
    });

    // Click the button to open modal
    const wrapper = createWrapper(document.body);
    const buttons = wrapper.findAllButtons();
    const changePasswordButton = buttons.find((button) =>
      button.getElement().textContent?.includes("Change SSH Password")
    );
    changePasswordButton?.click();

    const inputs = wrapper.findAllInputs();

    // Set values (new password, confirm password)
    inputs[0].setInputValue("NewPassword123");
    inputs[1].setInputValue("NewPassword123");

    // Click change password button
    const allButtons = wrapper.findAllButtons();
    const changePasswordSubmitButton = allButtons.find((button) =>
      button.getElement().textContent?.includes("Change Password")
    );

    changePasswordSubmitButton?.click();

    // Check for success alert
    await waitFor(() => {
      const containerWrapper = createWrapper(container);
      const alerts = containerWrapper.findAllAlerts();
      const successAlert = alerts.find((alert) =>
        alert.getElement().textContent?.includes("ssh password was changed successfully")
      );
      expect(successAlert).toBeTruthy();
    });
  });

  it("should display info alert based on SSH status", async () => {
    const { container } = render(<DeviceSshContainer />);

    await waitFor(() => {
      const wrapper = createWrapper(container);

      // Check for info alert when SSH is disabled
      const alerts = wrapper.findAllAlerts();
      const infoAlert = alerts.find((alert) =>
        alert
          .getElement()
          .textContent?.includes("Feature requires both the SSH service and the UFW firewall")
      );
      expect(infoAlert).toBeTruthy();
    });
  });
});
