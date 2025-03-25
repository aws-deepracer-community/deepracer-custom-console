import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseAppLayout from "../components/base-app-layout";
import Circle from '@uiw/react-color-circle';
import { TextContent, Modal, Checkbox, Alert, Form, FormField, Input, Container, Header, SpaceBetween, Button, KeyValuePairs, StatusIndicator, InputProps } from "@cloudscape-design/components";
import { ApiHelper } from '../common/helpers/api-helper';

// Add interfaces for API responses
interface NetworkResponse {
  success: boolean;
  SSID: string;
  ip_address: string;
  is_usb_connected: string;
}

interface PasswordResponse {
  success: boolean;
}

interface SshResponse {
  success: boolean;
  isSshEnabled?: string;
  isDefaultSshPasswordChanged?: string;
}

interface DeviceInfoResponse {
  success: boolean;
  hardware_version: string;
  software_version: string;
}

interface SoftwareUpdateResponse {
  success: boolean;
  status: string;
}

interface LedColorResponse {
  success: boolean;
  red?: number;
  green?: number;
  blue?: number;
}

var sshPasswordInputType: InputProps.Type = "password";
var devicePasswordInputType: InputProps.Type = 'password';

var oldPasswordError=true;
const validateOldPassword = (oldPassword: string) => {
  if (oldPassword.length === 0 ) {
    oldPasswordError=true;
    return "Old password is required";
  } else {
    oldPasswordError=false;
  }
}

var newPasswordError=true;
const validateNewPassword = (password: string) => {
  if ( password.length === 0) {
    return;
  }
  if ( password.length < 8) {
    newPasswordError=true;
    return "Password must be at least 8 characters long";
  }
  if ( ! /\d/.test(password) ) {
    newPasswordError=true;
    return "Password must contain at least one number";
  }
  if ( ! /[A-Z]/.test(password) ) {
    newPasswordError=true;
    return "Password must contain at least one uppercase character";
  }
  if ( ! /[a-z]/.test(password) ) {
    newPasswordError=true;
    return "Password must contain at least one lowercase character";
  }
  newPasswordError=false;
  return;
}

var confirmPasswordError=true;
const validateConfirmPassword = ( newPassword: string, confirmPassword: string) => {
  if ( newPassword.length === 0) {
    confirmPasswordError = true;
    return;
  }
  if ( newPassword != confirmPassword) {
    confirmPasswordError = true;
    return "New password and confirm password do not match";
  }
  confirmPasswordError = false;
  return;
}


const getColorRgb = (rgb: any) => {
  var hexcode: string = '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('')
  return hexcode;
};

const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({ SSID: 'Unknown', ip_address: 'Unknown', is_usb_connected: 'Unknown' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      const data = await ApiHelper.get<NetworkResponse>('get_network_details');
      if (data?.success) {
        setNetworkData({ SSID: data.SSID, ip_address: data.ip_address, is_usb_connected: data.is_usb_connected });
      }
    };
    fetchNetworkSettingsData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button onClick={() => navigate('/edit-network')}>Edit</Button>
            </SpaceBetween>
          }
        >
          Network Settings
        </Header>
      }
    >
        <KeyValuePairs
          columns={3}
          items={[
            { label: "Wi-Fi Network SSID", value: networkData.SSID == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : networkData.SSID },
            { label: "Vehicle IP Address", value: networkData.ip_address == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : networkData.ip_address },
            { label: "USB connection", value: networkData.is_usb_connected == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : networkData.is_usb_connected ? <StatusIndicator type="success">Connected</StatusIndicator> : <StatusIndicator type="info">Not Connected</StatusIndicator> }
          ]}
        />
    </Container>
  );
}

const DeviceConsolePasswordContainer = () => {
  const [devicePasswordModal, setdevicePasswordModal] = useState(false);
  const [deviceOldPassword, setdeviceOldPassword] = useState('');
  const [deviceNewPassword, setdeviceNewPassword] = useState('');
  const [deviceConfirmPassword, setdeviceConfirmPassword] = useState('');
  const [deviceShowPassword, setdeviceShowPassword] = useState(false);
  const [devicePasswordError, setdevicePasswordError] = useState('');
  const [devicePasswordErrorVisible, setdevicePasswordErrorVisible] = useState(false);
  const [devicePasswordChangedErrorVisible, setdevicePasswordChangedErrorVisible] = useState(false);
  const [devicePasswordChangedSuccessVisible, setdevicePasswordChangedSuccessVisible] = useState(false);
  const [devicePasswordChanging, setdevicePasswordChanging] = useState(false);

  const showDevicePasswordModal = (visible: boolean) => {
    setdevicePasswordModal(visible);
    setdevicePasswordChangedErrorVisible(false);
    setdevicePasswordErrorVisible(false);
    setdevicePasswordChanging(false);
    setdeviceShowPassword(false);
    setdevicePasswordChangedSuccessVisible(false);
    setdeviceOldPassword('');
    setdeviceNewPassword('');
    setdeviceConfirmPassword('');
    devicePasswordInputType='password';
  }

  const deviceShowPasswordToggle = (checked: boolean) => {
    setdeviceShowPassword(checked)
    if (checked) {
      devicePasswordInputType ='text'
    } else {
      devicePasswordInputType = 'password'
    }
  }

  const changedevicePasswordAction = async () => {
    var changePassword;
    if (oldPasswordError) {
      setdevicePasswordError('Old password is required');
      setdevicePasswordErrorVisible(true);
      return;
    }
    else if (newPasswordError) {
      setdevicePasswordError('New password is required and must meet the password requirements');
      setdevicePasswordErrorVisible(true);
      return;
    }
    else if (confirmPasswordError) {
      setdevicePasswordError('New and confirm Passwords do not match');
      setdevicePasswordErrorVisible(true);
      return;
    }
    else {
      setdevicePasswordError('');
      setdevicePasswordErrorVisible(false);
    }
    if ( ! oldPasswordError && ! newPasswordError && ! confirmPasswordError) {
      setdevicePasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>('password', { old_password: deviceOldPassword, new_password: deviceNewPassword });
    }
    if (changePassword && changePassword.success) {
        //console.log('password changed');
        setdevicePasswordChanging(true);
        setdevicePasswordModal(false);
        setdevicePasswordChangedSuccessVisible(true);
    }
    else {
      setdevicePasswordChangedErrorVisible(true);
      setdevicePasswordChanging(false);
      //console.log('password changed failed');
    }
  }

  return (
    <Container
      header={
        <Header actions={
            <SpaceBetween direction="horizontal" size="xs" >
              <Button onClick={() => showDevicePasswordModal(true)}>Change Device Console Password</Button>
            </SpaceBetween> }
        >
          Device console password
        </Header>
      }
    >
    <SpaceBetween direction="vertical" size="xs">
      <p>A password is required to protect access to your AWS DeepRacer vehicle. </p>
      <p>If you forget your password, <a href='https://docs.aws.amazon.com/console/deepracer/reset-your-password' target="_blank">reset your password. </a></p>
      { devicePasswordChangedSuccessVisible ? <Alert onDismiss={() => {setdevicePasswordChangedSuccessVisible(false) }} dismissible type="success">The device password was changed successfully.</Alert>: null }
    </SpaceBetween>
      <Modal
        onDismiss={() => showDevicePasswordModal(false)}
        visible={devicePasswordModal}
        header="Change Device Password"
      >
        <form onSubmit={e => e.preventDefault()}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button formAction="none" variant="link" onClick={() => showDevicePasswordModal(false) }>Cancel</Button>
                <Button variant="primary" loading={devicePasswordChanging} onClick={() => changedevicePasswordAction() }>Change Password</Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              <FormField  label="Old password" warningText={validateOldPassword(deviceOldPassword)} >
                <Input onChange={ event  => setdeviceOldPassword(event.detail.value)} type={devicePasswordInputType} inputMode='text' value={deviceOldPassword} disableBrowserAutocorrect />
              </FormField>
              <FormField
                label="New password"
                errorText={validateNewPassword(deviceNewPassword)}
                constraintText={<>Must contain at least one number and one uppercase and one lowercase letter, and at least 8 or more characters</>}
                >
                <Input onChange={event => setdeviceNewPassword(event.detail.value)} type={devicePasswordInputType} inputMode='text' value={deviceNewPassword} disableBrowserAutocorrect/>

              </FormField>
              <FormField
                label="Confirm new password"
                errorText={validateConfirmPassword(deviceNewPassword, deviceConfirmPassword)}
                >
                <Input onChange={event => setdeviceConfirmPassword(event.detail.value)} type={devicePasswordInputType} inputMode='text' value={deviceConfirmPassword} disableBrowserAutocorrect/>

              </FormField>

              <Checkbox onChange={ event => deviceShowPasswordToggle(event.detail.checked)} checked={deviceShowPassword} >Show Passwords</Checkbox>


            { devicePasswordErrorVisible ? <Alert type="error" onDismiss={() => {setdevicePasswordErrorVisible(false) }}  dismissible header={devicePasswordError} /> : null }
            { devicePasswordChangedErrorVisible ? <Alert onDismiss={() => {setdevicePasswordChangedErrorVisible(false) }} type="error" dismissible header='The device password change was unsuccessful' /> : null }
            </SpaceBetween>

          </Form>
        </form>
      </Modal>

    </Container>
  );
}

const DeviceSshContainer = () => {
  const [sshData, setSshData] = useState({ isSshEnabled: 'Unknown' });
  const [sshEnabling, setsshEnabling] = useState(false);
  const [sshDisabling, setsshDisabling] = useState(false);
  const [sshPasswordModal, setsshPasswordModal] = useState(false);
  const [sshOldPassword, setsshOldPassword] = useState('');
  const [sshNewPassword, setsshNewPassword] = useState('');
  const [sshConfirmPassword, setsshConfirmPassword] = useState('');
  const [sshShowPassword, setsshShowPassword] = useState(false);
  const [sshPasswordError, setsshPasswordError] = useState('');
  const [sshDefaultPasswordChanged, setsshDefaultPasswordChanged] = useState(false);
  const [sshPasswordErrorVisible, setsshPasswordErrorVisible] = useState(false);
  const [sshPasswordChangedErrorVisible, setsshPasswordChangedErrorVisible] = useState(false);
  const [sshPasswordChangedSuccessVisible, setsshPasswordChangedSuccessVisible] = useState(false);
  const [sshPasswordChanging, setsshPasswordChanging] = useState(false);

  const getIsSshDefaultPasswordChanged = async () => {
    const data = await ApiHelper.get<SshResponse>('isSshDefaultPasswordChanged');
    if (data?.success) {
      setsshDefaultPasswordChanged(data.isDefaultSshPasswordChanged === 'true');
    }
  }

  const changeSSHPasswordAction = async () => {
    var changePassword;
    if (oldPasswordError) {
      setsshPasswordError('Old password is required');
      setsshPasswordErrorVisible(true);
      return;
    }
    else if (newPasswordError) {
      setsshPasswordError('New password is required and must meet the password requirements');
      setsshPasswordErrorVisible(true);
      return;
    }
    else if (confirmPasswordError) {
      setsshPasswordError('New and confirm Passwords do not match');
      setsshPasswordErrorVisible(true);
      return;
    }
    else {
      setsshPasswordError('');
      setsshPasswordErrorVisible(false);
    }
    if (sshDefaultPasswordChanged && ! oldPasswordError && ! newPasswordError && ! confirmPasswordError) {
      setsshPasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>('resetSshPassword', { oldPassword: sshOldPassword, newPassword: sshNewPassword });
    }
    else if (! sshDefaultPasswordChanged && ! newPasswordError && ! confirmPasswordError) {
      // TODO need to check this after flash
      setsshPasswordChanging(true);
      changePassword = await ApiHelper.post<PasswordResponse>('resetSshPassword', { oldPassword: sshOldPassword, newPassword: sshNewPassword });
    }
    if (changePassword && changePassword.success) {
        //console.log('password changed');
        setsshPasswordChanging(false);
        setsshPasswordModal(false);
        setsshPasswordChangedSuccessVisible(true);
    }
    else {
      setsshPasswordChangedErrorVisible(true);
      setsshPasswordChanging(false);
      //console.log('password changed failed');
    }
  }

  const sshShowPasswordToggle = (checked: boolean) => {
    setsshShowPassword(checked)
    if (checked) {
      //setsshPasswordInputType('text')
      sshPasswordInputType = 'text'
    } else {
      // setsshPasswordInputType('password')
      sshPasswordInputType = 'password';
    }
  }

  const showSSHPasswordModal = (visible: boolean) => {
    getIsSshDefaultPasswordChanged();
    setsshPasswordChangedErrorVisible(false);
    setsshPasswordErrorVisible(false);
    setsshPasswordChanging(false);
    setsshShowPassword(false);
    setsshPasswordChangedSuccessVisible(false);
    setsshPasswordModal(visible);
    setsshOldPassword('');
    setsshNewPassword('');
    setsshConfirmPassword('');
    sshPasswordInputType = 'password';
  }

  const disbleSsh = async () => {
    setsshDisabling(true)
    const setSsh = await ApiHelper.get<SshResponse>('disableSsh');
    if (setSsh?.success) {
      var data = await ApiHelper.get<SshResponse>('isSshEnabled');
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? 'Unknown' });
      }
    };
    setsshDisabling(false)
  }

  const enableSsh = async () => {
    setsshEnabling(true)
    const setSsh = await ApiHelper.get<SshResponse>('enableSsh');
    if (setSsh?.success) {
      var data = await ApiHelper.get<SshResponse>('isSshEnabled');
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? 'Unknown' });
      }
    };
    setsshEnabling(false)
  }

  useEffect(() => {
    const fetchSshSettingsData = async () => {
      const data = await ApiHelper.get<SshResponse>('isSshEnabled');
      if (data?.success) {
        setSshData({ isSshEnabled: data.isSshEnabled ?? 'Unknown' });
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
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button loading={sshEnabling} disabled={sshData.isSshEnabled == 'Unknown' ? true : sshData.isSshEnabled ? true : false  } onClick={() => enableSsh()}>Enable SSH</Button>
              <Button loading={sshDisabling} disabled={sshData.isSshEnabled == 'Unknown' ? true : sshData.isSshEnabled ? false : true} onClick={() => disbleSsh()}>Disable SSH</Button>
              <Button disabled={sshData.isSshEnabled == 'Unknown' ? true : sshData.isSshEnabled ? false : true } onClick={() => setsshPasswordModal(true)}>Change SSH Password</Button>
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
            { label: "SSH Server", value: sshData.isSshEnabled == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : sshData.isSshEnabled ? <StatusIndicator type="success">Enabled</StatusIndicator> : <StatusIndicator type="info">Not enabled</StatusIndicator> },
            { label: "Username", value: sshData.isSshEnabled ? 'deepracer': '' },
          ]}
        />

        { sshData.isSshEnabled ? <Alert type="info">Type in "ssh deepracer@[IP Addresss]" on your terminal to log into the device remotely.</Alert>: null }
        { sshPasswordChangedSuccessVisible ? <Alert onDismiss={() => {setsshPasswordChangedSuccessVisible(false) }} dismissible type="success">The ssh password was changed successfully.</Alert>: null }
        </SpaceBetween>
      <Modal
        onDismiss={() => showSSHPasswordModal(false)}
        visible={sshPasswordModal}
        header="Change SSH Password"
      >
        <form onSubmit={e => e.preventDefault()}>
          <Form
            //errorText={validateSSHPasswordAll()}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button formAction="none" variant="link" onClick={() => showSSHPasswordModal(false) }>Cancel</Button>
                <Button variant="primary" loading={sshPasswordChanging} onClick={() => changeSSHPasswordAction() }>Change Password</Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween direction="vertical" size="l">

              { sshDefaultPasswordChanged ?
                <FormField  label="Old password" warningText={validateOldPassword(sshOldPassword)} constraintText={sshDefaultPasswordChanged? null : 'Old password is not required as default is still set' } >
                <Input onChange={ event  => setsshOldPassword(event.detail.value)} type={sshPasswordInputType} inputMode='text' value={sshOldPassword} disableBrowserAutocorrect />
              </FormField> : null }
              <FormField
                label="New password"
                errorText={validateNewPassword(sshNewPassword)}
                constraintText={<>Must contain at least one number and one uppercase and one lowercase letter, and at least 8 or more characters</>}
                >
                <Input onChange={event => setsshNewPassword(event.detail.value)} type={sshPasswordInputType} inputMode='text' value={sshNewPassword} disableBrowserAutocorrect/>

              </FormField>
              <FormField
                label="Confirm new password"
                errorText={validateConfirmPassword(sshNewPassword,sshConfirmPassword )}
                >
                <Input onChange={event => setsshConfirmPassword(event.detail.value)} type={sshPasswordInputType} inputMode='text' value={sshConfirmPassword} disableBrowserAutocorrect/>

              </FormField>

              <Checkbox onChange={ event => sshShowPasswordToggle(event.detail.checked)} checked={sshShowPassword} >Show Passwords</Checkbox>


            { sshPasswordErrorVisible ? <Alert type="error" onDismiss={() => {setsshPasswordErrorVisible(false) }}  dismissible header={sshPasswordError} /> : null }
            { sshPasswordChangedErrorVisible ? <Alert onDismiss={() => {setsshPasswordChangedErrorVisible(false) }} type="error" dismissible header='The ssh password change was unsuccessful' /> : null }
            </SpaceBetween>

          </Form>
        </form>
      </Modal>
    </Container>



  );
}

const LedColorContainer = () => {
  const [hex, setHex] = useState('#000000');
  const setLedColor = async (color: any) => {
    const setled = await ApiHelper.post<LedColorResponse>('set_led_color', { red: color.rgb.r, green: color.rgb.g, blue: color.rgb.b });
    if (setled && setled.success) {
      console.log('Set led color:', setled);
    }
  }
  const turnOffLed = async () => {
    const ledoff = await ApiHelper.post<LedColorResponse>('set_led_color', { red: 0, green: 0, blue: 0 });
    setHex('#000000');
    if ( ledoff && ledoff.success) {
      console.log('Set led color off:', ledoff);
    }
  }

  useEffect(() => {
    const fetchLedData = async () => {
      // must be in calibration mode to get led color
      const setCalibration = await ApiHelper.get<{ success: boolean }>('set_calibration_mode');
      if (setCalibration && setCalibration.success) {
        //console.log('Set calibration:', setCalibration);
        const ledData = await ApiHelper.get<LedColorResponse>('get_led_color');
        if (ledData && ledData.success) {
          var hexFromRgb = getColorRgb({r: ledData.red, g: ledData.green, b: ledData.blue});
          //console.log(ledData)
          setHex(hexFromRgb)
         // console.log(hexFromRgb)
        }
      }
    };


    fetchLedData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button onClick={() => turnOffLed()}>Turn Off LED</Button>
            </SpaceBetween>
          }
        >
          LED colour
        </Header>
      }
    >
      <Circle
      colors={[
        '#0000FF',
        '#1E8FFF',
        '#800080',
        '#673ab7',
        '#FF00FF',
        '#e91e63',
        '#FF0090',
        '#FF0000',
        '#FF8200',
        '#FFFF00',
        '#00FF00',
        '#417505',
        '#FFFFFF',
      ]}
      color={hex}
      pointProps={{
        style: {
          marginRight: 20,
        },
      }}
      onChange={(color) => {
        setHex(color.hex);
        setLedColor(color);
        console.log(color.rgb)
        console.log(color.hex)
      }}
    />
      </Container>
  );
}

const AboutContainer = () => {

  const [deviceInfo, setDeviceInfo] = useState({ hardware_version: 'Unknown', software_version: 'Unknown' });
  const [softwareInfo, setsoftwareInfo] = useState({ software_update_available: 'Unknown', mandatory_update: 'Unknown' });

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const deviceData = await ApiHelper.get<DeviceInfoResponse>('get_device_info');
      if (deviceData?.success) {
        setDeviceInfo({ hardware_version: deviceData.hardware_version, software_version: deviceData.software_version });
      }
      const softwareData = await ApiHelper.get<SoftwareUpdateResponse>('is_software_update_available');
      const mandatoryData = await ApiHelper.get<SoftwareUpdateResponse>('get_mandatory_update_status');
      if (softwareData?.success && mandatoryData?.success) {
        setsoftwareInfo({ software_update_available: softwareData.status, mandatory_update: mandatoryData.status });
      }

    };
    fetchDeviceInfo();
  }, []);
  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
          <Button disabled={softwareInfo.software_update_available == 'Unknown' ? true : softwareInfo.software_update_available ? false : true  } >Update Software</Button>
            </SpaceBetween>
          }
          >
          About
        </Header>
      }
    >
     {/* TO DO: Some Hardcoded values, need to create an API */}
     {/* TO DO: Need to code software update modal */}
     <p>AWS DeepRacer vehicle 1/18th scale 4WD monster truck chassis </p>
     <p>Ubuntu OS 20.04.1 LTS, Intel® OpenVINO™ toolkit, ROS2 Foxy</p>
     <p></p>
     <p></p>
        <KeyValuePairs
          columns={4}
          items={[
            { label: "Hardware Version", value: deviceInfo.hardware_version == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : deviceInfo.hardware_version },
            { label: "Software Version", value: deviceInfo.software_version == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : deviceInfo.software_version },
            { label: "Software Update Available", value: softwareInfo.software_update_available == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : softwareInfo.software_update_available ? <StatusIndicator type="warning">Software update Available</StatusIndicator> : <StatusIndicator type="success">Software up to date</StatusIndicator> },
            { label: "Mandatory Update", value: softwareInfo.mandatory_update == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : softwareInfo.mandatory_update ? <StatusIndicator type="error">Mandatory Update required</StatusIndicator> : <StatusIndicator type="success">Update not mandatory</StatusIndicator> }
          ]}
        />
        <p></p>
        <p></p>
        <KeyValuePairs
          columns={4}
          items={[
            { label: "Processor", value: 'Intel Atom™ Processor' },
            { label: "Memory", value: '4GB RAM/Storage 32 GB memory (expandable)'},
            { label: "Camera", value: '4MP with MJPEG' },
          ]}
        />
      </Container>
  );
}


export default function SettingsPage() {
  // useEffect(() => {
  // }, []);

  return (
    <BaseAppLayout
      content={
        <TextContent>
          <SpaceBetween size="l">
            <h1>Settings</h1>
            <p>Adjust your deepracer car settings</p>
            <NetworkSettingsContainer />
            <DeviceConsolePasswordContainer />
            <DeviceSshContainer />
            <LedColorContainer />
            <AboutContainer />
          </SpaceBetween>
        </TextContent>
      }
    />
  );
}
