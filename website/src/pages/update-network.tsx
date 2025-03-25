import { useEffect, useState } from 'react';
import { TextContent, Container, Header, SpaceBetween, KeyValuePairs, StatusIndicator, Button, Flashbar } from "@cloudscape-design/components";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import * as React from "react";
import { ApiHelper } from '../common/helpers/api-helper';

// Add interfaces for API responses
interface NetworkResponse {
  success: boolean;
  SSID: string;
  ip_address: string;
  is_usb_connected: string;
}

interface WifiNetwork {
  ssid: string;
  security_info: string;
  strength: number;
}

interface WifiResetResponse {
  success: boolean;
  ip_address: string;
}

const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({ SSID: 'Unknown', ip_address: 'Unknown', is_usb_connected: 'Unknown' });

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      const data = await ApiHelper.get<NetworkResponse>('get_network_details');
      if (data?.success) {
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
        <KeyValuePairs
          columns={2}
          items={[
            { label: "Wi-Fi Network SSID", value: networkData.SSID == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : networkData.SSID },
            { label: "Vehicle IP Address", value: networkData.ip_address == 'Unknown' ? <StatusIndicator type="warning">Unknown</StatusIndicator> : networkData.ip_address },
          ]}
        />
    </Container>
  );
}

interface UpdateNetworkSettingsContainerProps {
  setFlashbarItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const UpdateNetworkSettingsContainer = ({ setFlashbarItems }: UpdateNetworkSettingsContainerProps) => {
  const [checked, setChecked] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [wifiOptions, setWifiOptions] = useState([]);
  const [selectedWifi, setSelectedWifi] = useState<{ value: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchWifiOptions = async () => {
      const data = await ApiHelper.get<WifiNetwork[]>('available_wifi_info');
      if (data) {
        const options = data.map(network => ({
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <img 
                src={network.strength === 1 ? 'static/wifi-signal-low.svg' : 
                     network.strength === 2 ? 'static/wifi-signal-medium.svg' : 
                     'static/wifi-signal-high.svg'} 
                alt="Signal strength" 
                style={{ width: '20px', height: '20px' }} 
              />
              <span>{network.ssid}</span>
              <span style={{ marginLeft: 'auto' }}>({network.security_info})</span>
            </div>
          ),
          value: network.ssid,
        }));
        setWifiOptions(options);
      }
    };
    fetchWifiOptions();
  }, []);

  const handleWifiSelect = ({ detail }: { detail: any }) => {
    setSelectedWifi(detail.selectedOption);
  };

  const handleConnect = async () => {
    if (selectedWifi && value) {
      setIsConnecting(true);
      const response = await ApiHelper.post<WifiResetResponse>('wifi_reset', {
        wifi_name: selectedWifi.value,
        wifi_password: value,
      });

      setIsConnecting(false);
      if (response?.success) {
        const ipAddress = response.ip_address.includes(',') ? 
          response.ip_address.split(',')[0] : response.ip_address;
        
        setFlashbarItems([{
          type: 'success',
          header: `Successfully connected to Wifi network: ${selectedWifi.value}.`,
          content: (
            <Button onClick={() => window.open(`http://${ipAddress}`, '_blank')}>
              Go to Vehicle ({ipAddress})
            </Button>
          ),
          dismissible: true,
          onDismiss: () => setFlashbarItems([]),
        }]);
      } else {
        setFlashbarItems([{
          type: 'error',
          header: `Could not connect to the Wi-Fi network: ${selectedWifi.value}. Check your network ID and password and try again.`,
          dismissible: true,
          onDismiss: () => setFlashbarItems([]),
        }]);
      }
    }
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
         Update Wifi Network
        </Header>
      }
    >
        <KeyValuePairs
          columns={1}
          items={[
            { label: "", value: "Specify your Wi-Fi network details." },
            { label: "Wi-Fi network name (SSID)", value: (
              <Select
                options={wifiOptions}
                selectedOption={selectedWifi}
                onChange={handleWifiSelect}
                placeholder="Select a wifi network"
              />
            ) },
            { label: "Wi-Fi password", value: (
              <Input
              onChange={({ detail }) => setValue(detail.value)}
              value={value}
              type= {checked ? "text" : "password"}
              placeholder="Enter your password"
              />
            ) },
            { label: "", value: (
              <Checkbox
                onChange={({ detail }) => setChecked(detail.checked)}
                checked={checked}
              >
                Show Password
              </Checkbox>
            ) },
            { label: "", value: (
              <Button variant="primary" onClick={handleConnect}>Connect</Button>
            ) },
            { label: "", value: isConnecting && (
              <StatusIndicator type="in-progress">Connecting...</StatusIndicator>
            ) },
          ]}
        />
    </Container>
  );
}

export default function UpDateNetworkPage() {
  const [flashbarItems, setFlashbarItems] = useState<any[]>([]);

  return (
        <TextContent>
          <SpaceBetween size="l">
            <Flashbar items={flashbarItems} />
            <h1>DeepRacer Wi-Fi network connection</h1>
            <NetworkSettingsContainer />
            <UpdateNetworkSettingsContainer setFlashbarItems={setFlashbarItems} />
          </SpaceBetween>
        </TextContent>
  );
}
