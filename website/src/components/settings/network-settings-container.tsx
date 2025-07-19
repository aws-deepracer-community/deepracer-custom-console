import { useNavigate } from "react-router-dom";
import {
  Container,
  Header,
  SpaceBetween,
  Button,
  KeyValuePairs,
  StatusIndicator,
} from "@cloudscape-design/components";
import { useNetwork } from "../../common/hooks/use-network";

export const NetworkSettingsContainer = () => {
  const { ssid, ipAddresses, isUSBConnected, hasError } = useNetwork();
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
            value: hasError ? (
              <StatusIndicator type="warning">Unknown</StatusIndicator>
            ) : isUSBConnected ? (
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
