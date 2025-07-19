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
  is_usb_connected: boolean;
}

export const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({
    SSID: "Unknown",
    ip_address: "Unknown",
    is_usb_connected: undefined as boolean | undefined,
  });
  const navigate = useNavigate();

  // Helper function to get display value for network data
  const getDisplayValue = (value: string | undefined, defaultValue = "Unknown") => {
    return !value || value === defaultValue || hasError ? (
      <StatusIndicator type="warning">Unknown</StatusIndicator>
    ) : (
      value
    );
  };

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
            value: getDisplayValue(ssid),
          },
          {
            label: "Vehicle IP Address",
            value: getDisplayValue(ipAddresses.join(", ")),
          },
          {
            label: "USB connection",
            value:
              networkData.is_usb_connected === undefined ? (
                <StatusIndicator type="warning">Unknown</StatusIndicator>
              ) : networkData.is_usb_connected === true ? (
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
