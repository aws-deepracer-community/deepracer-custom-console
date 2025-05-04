import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Header,
  SpaceBetween,
  KeyValuePairs,
  StatusIndicator,
  Button,
  Flashbar,
  Select,
  Input,
  Checkbox,
  FormField,
  ContentLayout,
} from "@cloudscape-design/components";
import * as React from "react";

const getApi = async (path: string) => {
  try {
    const response = await axios.get("/api/" + path);
    return response.data;
  } catch (error) {
    if (error.response.status === 401) {
      console.log("Unauthorized");
      window.location.href = "/login";
      return null;
    }
    console.error("Error getting api" + path + ":", error);
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postApi = async (path: string, data: any) => {
  try {
    const response = await axios.post("/api/" + path, data);
    return response.data;
  } catch (error) {
    if (error.response.status === 401) {
      console.log("Unauthorized");
      window.location.href = "/login";
      return null;
    }
    console.error("Error posting to api" + path + ":", error);
    return null;
  }
};

const NetworkSettingsContainer = () => {
  const [networkData, setNetworkData] = useState({
    SSID: "Unknown",
    ip_address: "Unknown",
    is_usb_connected: "Unknown",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkSettingsData = async () => {
      setLoading(true);
      const data = await getApi("get_network_details");
      if (data && data.success) {
        setNetworkData({
          SSID: data.SSID,
          ip_address: data.ip_address,
          is_usb_connected: data.is_usb_connected,
        });
      }
      setLoading(false);
    };
    fetchNetworkSettingsData();
    const interval = setInterval(fetchNetworkSettingsData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container
      header={
        <Header actions={<SpaceBetween direction="horizontal" size="xs"></SpaceBetween>}>
          Network Settings
        </Header>
      }
    >
      <KeyValuePairs
        columns={2}
        items={[
          {
            label: "Wi-Fi Network SSID",
            value:
              !networkData.SSID || networkData.SSID === "Unknown" ? (
                loading ? (
                  <StatusIndicator type="loading">Loading...</StatusIndicator>
                ) : (
                  <StatusIndicator type="warning">Unknown</StatusIndicator>
                )
              ) : (
                networkData.SSID
              ),
          },
          {
            label: "Vehicle IP Address",
            value:
              !networkData.ip_address || networkData.ip_address === "Unknown" ? (
                loading ? (
                  <StatusIndicator type="loading">Loading...</StatusIndicator>
                ) : (
                  <StatusIndicator type="warning">Unknown</StatusIndicator>
                )
              ) : (
                networkData.ip_address
              ),
          },
        ]}
      />
    </Container>
  );
};

interface UpdateNetworkSettingsContainerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFlashbarItems: React.Dispatch<React.SetStateAction<any[]>>;
}

const UpdateNetworkSettingsContainer = ({
  setFlashbarItems,
}: UpdateNetworkSettingsContainerProps) => {
  const [checked, setChecked] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [wifiOptions, setWifiOptions] = useState([]);
  const [selectedWifi, setSelectedWifi] = useState<{ value: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingWifiList, setLoadingWifiList] = useState(true);

  useEffect(() => {
    const fetchWifiOptions = async () => {
      setLoadingWifiList(true);
      const data = await getApi("available_wifi_info");
      if (data) {
        const options = data.map(
          (network: { ssid: string; security_info: string; strength: number }) => {
            let iconUrl = "";
            if (network.strength === 1) {
              iconUrl = "static/wifi-signal-low.svg";
            } else if (network.strength === 2) {
              iconUrl = "static/wifi-signal-medium.svg";
            } else if (network.strength === 3 || network.strength === 4) {
              iconUrl = "static/wifi-signal-high.svg";
            }
            return {
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src={iconUrl}
                    alt="Signal strength"
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span>{network.ssid}</span>
                  <span style={{ marginLeft: "auto" }}>({network.security_info})</span>
                </div>
              ),
              value: network.ssid,
            };
          }
        );
        setWifiOptions(options);
      }
      setLoadingWifiList(false);
    };
    fetchWifiOptions();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWifiSelect = ({ detail }: { detail: any }) => {
    setSelectedWifi(detail.selectedOption);
  };

  const validateForm = () => {
    let valid = true;

    if (!selectedWifi) {
      setFlashbarItems([
        {
          type: "error",
          content: "Please select a Wi-Fi network",
          dismissible: true,
          onDismiss: () => setFlashbarItems([]),
        },
      ]);
      valid = false;
    }

    if (!password) {
      setPasswordError("Please enter a password");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;

    setIsConnecting(true);
    const data = {
      wifi_name: selectedWifi!.value,
      wifi_password: password,
    };
    const response = await postApi("wifi_reset", data);
    setIsConnecting(false);

    if (response && response.success) {
      const ipAddress = response.ip_address.includes(",")
        ? response.ip_address.split(",")[0]
        : response.ip_address;
      setFlashbarItems([
        {
          type: "success",
          content: `Successfully connected to Wifi network: ${
            selectedWifi!.value
          } with IP address: ${ipAddress}`,
          action: (
            <Button onClick={() => window.open(`http://${ipAddress}`, "_blank")}>
              Go to Vehicle
            </Button>
          ),
          dismissible: true,
          onDismiss: () => setFlashbarItems([]),
        },
      ]);
      // Reset form
      setPassword("");
      setSelectedWifi(null);
    } else {
      setFlashbarItems([
        {
          type: "error",
          header: `Could not connect to the Wi-Fi network: ${selectedWifi!.value}`,
          content: "Check your network ID and password and try again.",
          dismissible: true,
          onDismiss: () => setFlashbarItems([]),
        },
      ]);
    }
  };

  return (
    <Container header={<Header>Update Wi-Fi Network</Header>}>
      <SpaceBetween size="l">
        <FormField label="Wi-Fi network name (SSID)">
          <Select
            options={wifiOptions}
            selectedOption={selectedWifi}
            onChange={handleWifiSelect}
            placeholder="Select a Wi-Fi network"
            loadingText="Loading available networks..."
            empty="No Wi-Fi networks found"
            filteringPlaceholder="Find a network"
            statusType={loadingWifiList ? "loading" : undefined}
          />
        </FormField>

        <FormField label="Wi-Fi password" errorText={passwordError}>
          <Input
            onChange={({ detail }) => {
              setPassword(detail.value);
              if (detail.value) setPasswordError("");
            }}
            value={password}
            type={checked ? "text" : "password"}
            placeholder="Enter your password"
            disabled={isConnecting}
          />
        </FormField>

        <Checkbox onChange={({ detail }) => setChecked(detail.checked)} checked={checked}>
          Show Password
        </Checkbox>

        <SpaceBetween direction="horizontal" size="xs" alignItems="center">
          <Button
            variant="primary"
            onClick={handleConnect}
            loading={isConnecting}
            disabled={!selectedWifi}
          >
            {isConnecting ? "Connecting" : "Connect"}
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  );
};

export default function UpDateNetworkPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [flashbarItems, setFlashbarItems] = useState<any[]>([]);

  return (
    <ContentLayout
      header={
        <div>
          <Flashbar items={flashbarItems} />
          <Header variant="h1" description="Connect your DeepRacer to get started">
            Update the Wi-Fi network settings
          </Header>
        </div>
      }
      defaultPadding
    >
      <SpaceBetween size="l" direction="vertical">
        <NetworkSettingsContainer />
        <UpdateNetworkSettingsContainer setFlashbarItems={setFlashbarItems} />
      </SpaceBetween>
    </ContentLayout>
  );
}
