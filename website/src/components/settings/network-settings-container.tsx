import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Header,
  SpaceBetween,
  Button,
  KeyValuePairs,
  StatusIndicator,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";

// Add interfaces for API responses
interface NetworkResponse {
  success: boolean;
  SSID: string;
  ip_address: string;
  is_usb_connected: string;
}

export const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({
    SSID: "Unknown",
    ip_address: "Unknown",
    is_usb_connected: "Unknown",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      const data = await ApiHelper.get<NetworkResponse>("get_network_details");
      if (data?.success) {
        setNetworkData({
          SSID: data.SSID,
          ip_address: data.ip_address,
          is_usb_connected: data.is_usb_connected,
        });
      }
    };
    fetchNetworkSettingsData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate("/edit-network")}>Edit</Button>
            </SpaceBetween>
          }
          description="Network refresh happens at 1 minute intervals, please be patient to see recent changes
          such as connecting via USB."
        >
          Network Settings
        </Header>
      }
    >
      <KeyValuePairs
        columns={3}
        items={[
          {
            label: "Wi-Fi Network SSID",
            value:
              networkData.SSID === "Unknown" ? (
                <StatusIndicator type="warning">Unknown</StatusIndicator>
              ) : (
                networkData.SSID
              ),
          },
          {
            label: "Vehicle IP Address",
            value:
              networkData.ip_address === "Unknown" ? (
                <StatusIndicator type="warning">Unknown</StatusIndicator>
              ) : (
                networkData.ip_address
              ),
          },
          {
            label: "USB connection",
            value:
              networkData.is_usb_connected === "Unknown" ? (
                <StatusIndicator type="warning">Unknown</StatusIndicator>
              ) : networkData.is_usb_connected ? (
                <StatusIndicator type="success">Connected</StatusIndicator>
              ) : (
                <StatusIndicator type="info">Not Connected</StatusIndicator>
              ),
          },
        ]}
      />
    </Container>
  );
};
