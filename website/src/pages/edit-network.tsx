import { useEffect, useState } from 'react';
import axios from 'axios';
import BaseAppLayout from "../components/base-app-layout";
import { TextContent, Container, Header, SpaceBetween, KeyValuePairs, StatusIndicator, Button } from "@cloudscape-design/components";

const getApi = async (path: string) => {
  try {
    const response = await axios.get('/api/' + path);
    return response.data;
  } catch (error) {
    if (error.response.status === 401) {
      console.log('Unauthorized');
      window.location.href = '/login';
      return null;
    }
    console.error('Error getting api' + path + ':', error);
    return null;
  }
};

const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({ SSID: 'Unknown', ip_address: 'Unknown', is_usb_connected: 'Unknown' });

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      const data = await getApi('get_network_details');
      if (data && data.success) {
        setNetworkData({ SSID: data.SSID, ip_address: data.ip_address, is_usb_connected: data.is_usb_connected });
      }
    };
    fetchNetworkSettingsData();
    const interval = setInterval(fetchNetworkSettingsData, 5000);
    return () => clearInterval(interval);
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
            </SpaceBetween>
          }
        >
          Network Settings
        </Header>
      }
    >
        <SpaceBetween direction="vertical" size="xs">
          <p>Network refresh happens at 1 minute intervals, please be patient to see recent changes such as connecting via USB. </p>
          <p></p>
        </SpaceBetween>
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

const ConnectUSBContainer = () => {
  const [isUsbConnected, setIsUsbConnected] = useState(false);

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      const data = await getApi('get_network_details');
      if (data && data.success) {
        setIsUsbConnected(data.is_usb_connected);
      }
    };
    fetchNetworkSettingsData();
    const interval = setInterval(fetchNetworkSettingsData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openDeepracerAws = () => {
    window.open('https://deepracer.aws', '_blank');
  };

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
            </SpaceBetween>
          }
        >
          Instructions
        </Header>
      }
    >
      <h3>Connect your USB cable to the vehicle</h3>
      <p>Use the included USB cable to connect your computer to the vehicle</p>
      <img src="static/usb_connect.svg" alt="Connect USB to Vehicle" />
      {isUsbConnected && <h3>Go to deepracer.aws</h3>}
      {isUsbConnected && <p>After the USB connection has been detected, go to deepracer.aws and login to the system</p>}
      {isUsbConnected && <Button onClick={openDeepracerAws}>Go to deepracer.aws</Button>}
    </Container>
  );
}

export default function EditNetworkPage() {

  return (
    <BaseAppLayout
      content={
        <TextContent>
          <SpaceBetween size="l">
            <h1>Edit Network Settings</h1>
            <NetworkSettingsContainer />
            <ConnectUSBContainer />``
          </SpaceBetween>
        </TextContent>
      }
    />
  );
}
