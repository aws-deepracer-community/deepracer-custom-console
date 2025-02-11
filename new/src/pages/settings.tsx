import { useEffect, useState } from 'react';
import { TextContent, Modal, Box } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Circle from '@uiw/react-color-circle';


const getApi = async (path: string) => {
  try {
    const response = await axios.get('/api/' + path);
    return response.data;
  } catch (error) {
    console.error('Error getting api' + path + ':', error);
    return null;
  }
};

const postApi = async (path: string, data) => {
  try {
    const response = await axios.post('/api/' + path, data);
    return response.data;
  } catch (error) {
    console.error('Error posting api' + path + ':', error, 'with data:', data);
    return null;
  }
};


const getColorRgb = (rgb) => {
  var hexcode = '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('')
  return hexcode;
};

const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({ SSID: 'Unknown', ip_address: 'Unknown', is_usb_connected: 'Unknown' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      // const data = await getNetworkSettings();
      const data = await getApi('get_network_details');
      if (data && data.success) {
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
  // const [networkData, setNetworkData] = useState({ SSID: 'Value', ip_address: 'Value', is_usb_connected: 'Value' });
  const navigate = useNavigate();

  // useEffect(() => {
  //   const fetchNetworkSettingsData = async () => {
  //     const data = await getNetworkSettings();
  //     if (data && data.success) {
  //       setNetworkData({ SSID: data.SSID, ip_address: data.ip_address, is_usb_connected: data.is_usb_connected });
  //     }
  //   };
  //   fetchNetworkSettingsData();
  // }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button onClick={() => navigate('/passwordReset')}>Change Device Console Password</Button>
            </SpaceBetween>
          }
        >
          Device console password
        </Header>
      }
    >
        <KeyValuePairs
          columns={1}
          items={[
            { label: "Password", value: '*****************' }
          ]}
        />
    </Container>
  );
}

const DeviceSshContainer = () => {
  const [sshData, setSshData] = useState({ isSshEnabled: 'Unknown' });
  const [sshEnabling, setsshEnabling] = useState(false);
  const [sshDisabling, setsshDisabling] = useState(false);
  const [sshPasswordModal, setsshPasswordModal] = useState(false);
//  const navigate = useNavigate();
  const disbleSsh = async () => {
    setsshDisabling(true)
    const setSsh = await getApi('disableSsh');
    if (setSsh && setSsh.success) {
      var data = await getApi('isSshEnabled');
      if (data && data.success) {
        setSshData({ isSshEnabled: data.isSshEnabled });
      }
    };
    setsshDisabling(false)
  }

  const enableSsh = async () => {
    setsshEnabling(true)
    const setSsh = await getApi('enableSsh');
    if (setSsh && setSsh.success) {
      var data = await getApi('isSshEnabled');
      if (data && data.success) {
        setSshData({ isSshEnabled: data.isSshEnabled });
      }
    };
    setsshEnabling(false)
  }


  useEffect(() => {
    const fetchSshSettingsData = async () => {
      const data = await getApi('isSshEnabled');
      if (data && data.success) {
        setSshData({ isSshEnabled: data.isSshEnabled });
      }
    };
    fetchSshSettingsData();
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
        <KeyValuePairs
          columns={2}
          items={[
            { label: "SSH Server", value: sshData.isSshEnabled == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : sshData.isSshEnabled ? <StatusIndicator type="success">Enabled</StatusIndicator> : <StatusIndicator type="info">Not enabled</StatusIndicator> },
            { label: "Password", value: '*****************' }
          ]}
        />
      <Modal
        onDismiss={() => setsshPasswordModal(false)}
        visible={sshPasswordModal}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link">Cancel</Button>
              <Button variant="primary">Ok</Button>
            </SpaceBetween>
          </Box>
        }
        header="Change SSH Password"
      >
        Your description should go here
      </Modal>
    </Container>



  );
}

const LedColorContainer = () => {
  const [hex, setHex] = useState('#000000');
  const setLedColor = async (color) => {
    const setled = await postApi('set_led_color', { red: color.rgb.r, green: color.rgb.g, blue: color.rgb.b });
    if (setled && setled.success) {
      console.log('Set led color:', setled);
    }
  }
  const turnOffLed = async () => {
    const ledoff = await postApi('set_led_color', { red: 0, green: 0, blue: 0 });
    setHex('#000000');
    if ( ledoff && ledoff.success) {
      console.log('Set led color off:', ledoff);
    }
  }

  useEffect(() => {
    const fetchLedData = async () => {
      // must be in calibration mode to get led color
      const setCalibration = await getApi('set_calibration_mode');
      if (setCalibration && setCalibration.success) {
        console.log('Set calibration:', setCalibration);
        const ledData = await getApi('get_led_color');
        if (ledData && ledData.success) {
          var hexFromRgb = getColorRgb({r: ledData.red, g: ledData.green, b: ledData.blue});
          console.log(ledData)
          setHex(hexFromRgb)
          console.log(hexFromRgb)
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

  // TO DO: Some Hardcoded values, need to create an API

  const [deviceInfo, setDeviceInfo] = useState({ hardware_version: 'Unknown', software_version: 'Unknown' });
  const [softwareInfo, setsoftwareInfo] = useState({ software_update_available: 'Unknown', mandatory_update: 'Unknown' });

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const deviceData = await getApi('get_device_info');
      if (deviceData && deviceData.success) {
        setDeviceInfo({ hardware_version: deviceData.hardware_version, software_version: deviceData.software_version });
      }
      const softwareData = await getApi('is_software_update_available');
      const mandatoryData = await getApi('get_mandatory_update_status');
      if (softwareData && softwareData.success && mandatoryData && mandatoryData.success) {
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
  useEffect(() => {
    // setNetwork();
  }, []);

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

