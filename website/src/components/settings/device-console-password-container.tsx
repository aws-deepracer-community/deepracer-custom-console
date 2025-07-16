import { useState } from "react";
import {
  Alert,
  Form,
  FormField,
  Input,
  Container,
  Header,
  SpaceBetween,
  Button,
  Modal,
  Checkbox,
  InputProps,
  Box,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";
import {
  oldPasswordError,
  newPasswordError,
  confirmPasswordError,
  validateOldPassword,
  validateNewPassword,
  validateConfirmPassword,
} from "./validation-utils";

interface PasswordResponse {
  success: boolean;
}

let devicePasswordInputType: InputProps.Type = "password";

export const DeviceConsolePasswordContainer = () => {
  const [devicePasswordModal, setdevicePasswordModal] = useState(false);
  const [deviceOldPassword, setdeviceOldPassword] = useState("");
  const [deviceNewPassword, setdeviceNewPassword] = useState("");
  const [deviceConfirmPassword, setdeviceConfirmPassword] = useState("");
  const [deviceShowPassword, setdeviceShowPassword] = useState(false);
  const [devicePasswordError, setdevicePasswordError] = useState("");
  const [devicePasswordErrorVisible, setdevicePasswordErrorVisible] = useState(false);
  const [devicePasswordChangedErrorVisible, setdevicePasswordChangedErrorVisible] = useState(false);
  const [devicePasswordChangedSuccessVisible, setdevicePasswordChangedSuccessVisible] =
    useState(false);
  const [devicePasswordChanging, setdevicePasswordChanging] = useState(false);

  const showDevicePasswordModal = (visible: boolean) => {
    setdevicePasswordModal(visible);
    setdevicePasswordChangedErrorVisible(false);
    setdevicePasswordErrorVisible(false);
    setdevicePasswordChanging(false);
    setdeviceShowPassword(false);
    setdevicePasswordChangedSuccessVisible(false);
    setdeviceOldPassword("");
    setdeviceNewPassword("");
    setdeviceConfirmPassword("");
    devicePasswordInputType = "password";
  };

  const deviceShowPasswordToggle = (checked: boolean) => {
    setdeviceShowPassword(checked);
    if (checked) {
      devicePasswordInputType = "text";
    } else {
      devicePasswordInputType = "password";
    }
  };

  const changedevicePasswordAction = async () => {
    let changePassword;
    if (oldPasswordError) {
      setdevicePasswordError("Old password is required");
      setdevicePasswordErrorVisible(true);
      return;
    } else if (newPasswordError) {
      setdevicePasswordError("New password is required and must meet the password requirements");
      setdevicePasswordErrorVisible(true);
      return;
    } else if (confirmPasswordError) {
      setdevicePasswordError("New and confirm Passwords do not match");
      setdevicePasswordErrorVisible(true);
      return;
    } else {
      setdevicePasswordError("");
      setdevicePasswordErrorVisible(false);
    }
    if (!oldPasswordError && !newPasswordError && !confirmPasswordError) {
      setdevicePasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>("password", {
        old_password: deviceOldPassword,
        new_password: deviceNewPassword,
      });
    }
    if (changePassword && changePassword.success) {
      //console.log('password changed');
      setdevicePasswordChanging(true);
      setdevicePasswordModal(false);
      setdevicePasswordChangedSuccessVisible(true);
    } else {
      setdevicePasswordChangedErrorVisible(true);
      setdevicePasswordChanging(false);
      //console.log('password changed failed');
    }
  };

  return (
    <Container
      header={
        <Header
          actions={
            <Button onClick={() => showDevicePasswordModal(true)}>
              Change Device Console Password
            </Button>
          }
          description="A password is required to protect access to your AWS DeepRacer vehicle."
        >
          Device console password
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="xs">
        <Box>
          If you forget your password,{" "}
          <a
            href="https://docs.aws.amazon.com/console/deepracer/reset-your-password"
            target="_blank"
          >
            reset your password.{" "}
          </a>
        </Box>
        {devicePasswordChangedSuccessVisible ? (
          <Alert
            onDismiss={() => {
              setdevicePasswordChangedSuccessVisible(false);
            }}
            dismissible
            type="success"
          >
            The device password was changed successfully.
          </Alert>
        ) : null}
      </SpaceBetween>
      <Modal
        onDismiss={() => showDevicePasswordModal(false)}
        visible={devicePasswordModal}
        header="Change Device Password"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  formAction="none"
                  variant="link"
                  onClick={() => showDevicePasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={devicePasswordChanging}
                  onClick={() => changedevicePasswordAction()}
                >
                  Change Password
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              <FormField label="Old password" warningText={validateOldPassword(deviceOldPassword)}>
                <Input
                  onChange={(event) => setdeviceOldPassword(event.detail.value)}
                  type={devicePasswordInputType}
                  inputMode="text"
                  value={deviceOldPassword}
                  disableBrowserAutocorrect
                />
              </FormField>
              <FormField
                label="New password"
                errorText={validateNewPassword(deviceNewPassword)}
                constraintText={
                  <>
                    Must contain at least one number and one uppercase and one lowercase letter, and
                    at least 8 or more characters
                  </>
                }
              >
                <Input
                  onChange={(event) => setdeviceNewPassword(event.detail.value)}
                  type={devicePasswordInputType}
                  inputMode="text"
                  value={deviceNewPassword}
                  disableBrowserAutocorrect
                />
              </FormField>
              <FormField
                label="Confirm new password"
                errorText={validateConfirmPassword(deviceNewPassword, deviceConfirmPassword)}
              >
                <Input
                  onChange={(event) => setdeviceConfirmPassword(event.detail.value)}
                  type={devicePasswordInputType}
                  inputMode="text"
                  value={deviceConfirmPassword}
                  disableBrowserAutocorrect
                />
              </FormField>

              <Checkbox
                onChange={(event) => deviceShowPasswordToggle(event.detail.checked)}
                checked={deviceShowPassword}
              >
                Show Passwords
              </Checkbox>

              {devicePasswordErrorVisible ? (
                <Alert
                  type="error"
                  onDismiss={() => {
                    setdevicePasswordErrorVisible(false);
                  }}
                  dismissible
                  header={devicePasswordError}
                />
              ) : null}
              {devicePasswordChangedErrorVisible ? (
                <Alert
                  onDismiss={() => {
                    setdevicePasswordChangedErrorVisible(false);
                  }}
                  type="error"
                  dismissible
                  header="The device password change was unsuccessful"
                />
              ) : null}
            </SpaceBetween>
          </Form>
        </form>
      </Modal>
    </Container>
  );
};
