import { useEffect, useState } from "react";
import {
  Alert,
  Form,
  FormField,
  Input,
  Container,
  Header,
  SpaceBetween,
  Button,
  KeyValuePairs,
  StatusIndicator,
  Modal,
  Checkbox,
  InputProps,
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

interface SshResponse {
  success: boolean;
  isSshEnabled?: string;
  isDefaultSshPasswordChanged?: boolean;
}

let sshPasswordInputType: InputProps.Type = "password";

export const DeviceSshContainer = () => {
  const [sshData, setSshData] = useState({ isSshEnabled: "Unknown" });
  const [sshEnabling, setsshEnabling] = useState(false);
  const [sshDisabling, setsshDisabling] = useState(false);
  const [sshPasswordModal, setsshPasswordModal] = useState(false);
  const [sshOldPassword, setsshOldPassword] = useState("");
  const [sshNewPassword, setsshNewPassword] = useState("");
  const [sshConfirmPassword, setsshConfirmPassword] = useState("");
  const [sshShowPassword, setsshShowPassword] = useState(false);
  const [sshPasswordError, setsshPasswordError] = useState("");
  const [sshDefaultPasswordChanged, setsshDefaultPasswordChanged] = useState(false);
  const [sshPasswordErrorVisible, setsshPasswordErrorVisible] = useState(false);
  const [sshPasswordChangedErrorVisible, setsshPasswordChangedErrorVisible] = useState(false);
  const [sshPasswordChangedSuccessVisible, setsshPasswordChangedSuccessVisible] = useState(false);
  const [sshPasswordChanging, setsshPasswordChanging] = useState(false);

  const getIsSshDefaultPasswordChanged = async () => {
    const data = await ApiHelper.get<SshResponse>("isSshDefaultPasswordChanged");
    if (data?.success) {
      setsshDefaultPasswordChanged(
        data.isDefaultSshPasswordChanged ? data.isDefaultSshPasswordChanged : false
      );
    }
  };

  const changeSSHPasswordAction = async () => {
    let changePassword;
    if (oldPasswordError) {
      setsshPasswordError("Old password is required");
      setsshPasswordErrorVisible(true);
      return;
    } else if (newPasswordError) {
      setsshPasswordError("New password is required and must meet the password requirements");
      setsshPasswordErrorVisible(true);
      return;
    } else if (confirmPasswordError) {
      setsshPasswordError("New and confirm Passwords do not match");
      setsshPasswordErrorVisible(true);
      return;
    } else {
      setsshPasswordError("");
      setsshPasswordErrorVisible(false);
    }
    if (
      sshDefaultPasswordChanged &&
      !oldPasswordError &&
      !newPasswordError &&
      !confirmPasswordError
    ) {
      setsshPasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>("resetSshPassword", {
        oldPassword: sshOldPassword,
        newPassword: sshNewPassword,
      });
    } else if (!sshDefaultPasswordChanged && !newPasswordError && !confirmPasswordError) {
      // TODO need to check this after flash
      setsshPasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>("resetSshPassword", {
        oldPassword: "deepracer",
        newPassword: sshNewPassword,
      });
    }
    if (changePassword && changePassword.success) {
      //console.log('password changed');
      setsshPasswordChanging(false);
      setsshPasswordModal(false);
      setsshPasswordChangedSuccessVisible(true);
      setsshDefaultPasswordChanged(true);
    } else {
      setsshPasswordChangedErrorVisible(true);
      setsshPasswordChanging(false);
      //console.log('password changed failed');
    }
  };

  const sshShowPasswordToggle = (checked: boolean) => {
    setsshShowPassword(checked);
    if (checked) {
      //setsshPasswordInputType('text')
      sshPasswordInputType = "text";
    } else {
      // setsshPasswordInputType('password')
      sshPasswordInputType = "password";
    }
  };

  const showSSHPasswordModal = (visible: boolean) => {
    setsshPasswordChangedErrorVisible(false);
    setsshPasswordErrorVisible(false);
    setsshPasswordChanging(false);
    setsshShowPassword(false);
    setsshPasswordChangedSuccessVisible(false);
    setsshPasswordModal(visible);
    setsshOldPassword("");
    setsshNewPassword("");
    setsshConfirmPassword("");
    sshPasswordInputType = "password";
  };

  const disableSsh = async () => {
    setsshDisabling(true);
    const setSsh = await ApiHelper.get<SshResponse>("disableSsh");
    if (setSsh?.success) {
      const data = await ApiHelper.get<SshResponse>("isSshEnabled");
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? "Unknown" });
      }
    }
    setsshDisabling(false);
  };

  const enableSsh = async () => {
    setsshEnabling(true);
    const setSsh = await ApiHelper.get<SshResponse>("enableSsh");
    if (setSsh?.success) {
      const data = await ApiHelper.get<SshResponse>("isSshEnabled");
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? "Unknown" });
      }
    }
    setsshEnabling(false);
  };

  useEffect(() => {
    const fetchSshSettingsData = async () => {
      const data = await ApiHelper.get<SshResponse>("isSshEnabled");
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? "Unknown" });
      }
    };
    fetchSshSettingsData();
    getIsSshDefaultPasswordChanged();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                loading={sshEnabling}
                disabled={
                  sshData.isSshEnabled === "Unknown" ? true : sshData.isSshEnabled ? true : false
                }
                onClick={() => enableSsh()}
              >
                Enable SSH
              </Button>
              <Button
                loading={sshDisabling}
                disabled={
                  sshData.isSshEnabled === "Unknown" ? true : sshData.isSshEnabled ? false : true
                }
                onClick={() => disableSsh()}
              >
                Disable SSH
              </Button>
              <Button
                disabled={
                  sshData.isSshEnabled === "Unknown" ? true : sshData.isSshEnabled ? false : true
                }
                onClick={() => showSSHPasswordModal(true)}
              >
                Change SSH Password
              </Button>
            </SpaceBetween>
          }
        >
          Device SSH
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: "SSH Server",
              value:
                sshData.isSshEnabled === "Unknown" ? (
                  <StatusIndicator type="warning">Unknown</StatusIndicator>
                ) : sshData.isSshEnabled ? (
                  <StatusIndicator type="success">Enabled</StatusIndicator>
                ) : (
                  <StatusIndicator type="info">Not enabled</StatusIndicator>
                ),
            },
            { label: "Username", value: sshData.isSshEnabled ? "deepracer" : "" },
          ]}
        />

        {sshData.isSshEnabled ? (
          <Alert type="info">
            Type in "ssh deepracer@[IP Addresss]" on your terminal to log into the device remotely.
          </Alert>
        ) : (
          <Alert type="info">
            Feature requires both the SSH service and the UFW firewall to be enabled.
          </Alert>
        )}
        {sshPasswordChangedSuccessVisible ? (
          <Alert
            onDismiss={() => {
              setsshPasswordChangedSuccessVisible(false);
            }}
            dismissible
            type="success"
          >
            The ssh password was changed successfully.
          </Alert>
        ) : null}
      </SpaceBetween>
      <Modal
        onDismiss={() => showSSHPasswordModal(false)}
        visible={sshPasswordModal}
        header="Change SSH Password"
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <Form
            //errorText={validateSSHPasswordAll()}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  formAction="none"
                  variant="link"
                  onClick={() => showSSHPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={sshPasswordChanging}
                  onClick={() => changeSSHPasswordAction()}
                >
                  Change Password
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              {sshDefaultPasswordChanged ? (
                <FormField
                  label="Old password"
                  warningText={validateOldPassword(sshOldPassword, sshDefaultPasswordChanged)}
                  constraintText={
                    sshDefaultPasswordChanged
                      ? null
                      : "Old password is not required as default is still set"
                  }
                >
                  <Input
                    onChange={(event) => setsshOldPassword(event.detail.value)}
                    type={sshPasswordInputType}
                    inputMode="text"
                    value={sshOldPassword}
                    disableBrowserAutocorrect
                  />
                </FormField>
              ) : null}
              <FormField
                label="New password"
                errorText={validateNewPassword(sshNewPassword)}
                constraintText={
                  <>
                    Must contain at least one number and one uppercase and one lowercase letter, and
                    at least 8 or more characters
                  </>
                }
              >
                <Input
                  onChange={(event) => setsshNewPassword(event.detail.value)}
                  type={sshPasswordInputType}
                  inputMode="text"
                  value={sshNewPassword}
                  disableBrowserAutocorrect
                />
              </FormField>
              <FormField
                label="Confirm new password"
                errorText={validateConfirmPassword(sshNewPassword, sshConfirmPassword)}
              >
                <Input
                  onChange={(event) => setsshConfirmPassword(event.detail.value)}
                  type={sshPasswordInputType}
                  inputMode="text"
                  value={sshConfirmPassword}
                  disableBrowserAutocorrect
                />
              </FormField>

              <Checkbox
                onChange={(event) => sshShowPasswordToggle(event.detail.checked)}
                checked={sshShowPassword}
              >
                Show Passwords
              </Checkbox>

              {sshPasswordErrorVisible ? (
                <Alert
                  type="error"
                  onDismiss={() => {
                    setsshPasswordErrorVisible(false);
                  }}
                  dismissible
                  header={sshPasswordError}
                />
              ) : null}
              {sshPasswordChangedErrorVisible ? (
                <Alert
                  onDismiss={() => {
                    setsshPasswordChangedErrorVisible(false);
                  }}
                  type="error"
                  dismissible
                  header="The ssh password change was unsuccessful"
                />
              ) : null}
            </SpaceBetween>
          </Form>
        </form>
      </Modal>
    </Container>
  );
};
