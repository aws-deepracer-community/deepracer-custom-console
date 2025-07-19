import { useEffect, useState } from "react";
import {
  Container,
  Header,
  SpaceBetween,
  Button,
  KeyValuePairs,
  StatusIndicator,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";
import { SoftwareUpdateModal } from "./software-update-modal";

interface DeviceInfoResponse {
  success: boolean;
  hardware_version: string;
  software_version: string;
  cpu_model?: string;
  ram_amount?: string;
  disk_amount?: string;
  ros_distro?: string;
  os_version?: string;
}

interface SoftwareUpdateResponse {
  success: boolean;
  status: boolean; // Changed from string to boolean since API returns boolean
}

export const AboutContainer = () => {
  const SOFTWARE_UPDATE_TIMEOUT_MS = 30000; // 30 seconds timeout for software update check

  const [deviceInfo, setDeviceInfo] = useState<{
    hardware_version: string;
    software_version: string;
    cpu_model?: string;
    ram_amount?: string;
    disk_amount?: string;
    ros_distro?: string;
    os_version?: string;
  }>({
    hardware_version: "Unknown",
    software_version: "Unknown",
  });
  const [softwareInfo, setSoftwareInfo] = useState<{
    software_update_available: boolean | null; // null = unknown, boolean = true/false
    mandatory_update: boolean | null;
  }>({
    software_update_available: null, // Start with null (unknown)
    mandatory_update: null,
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const deviceData = await ApiHelper.get<DeviceInfoResponse>("get_device_info");
      if (deviceData?.success) {
        setDeviceInfo({
          hardware_version: deviceData.hardware_version,
          software_version: deviceData.software_version,
          cpu_model: deviceData.cpu_model || "Intel Atom™ Processor",
          ram_amount: deviceData.ram_amount || "4 GB",
          disk_amount: deviceData.disk_amount || "32 GB",
          ros_distro: deviceData.ros_distro || "ROS2 Foxy",
          os_version: deviceData.os_version || "Ubuntu OS 20.04.1 LTS",
        });
      }
      const softwareData = await ApiHelper.get<SoftwareUpdateResponse>(
        "is_software_update_available",
        SOFTWARE_UPDATE_TIMEOUT_MS
      );
      const mandatoryData = await ApiHelper.get<SoftwareUpdateResponse>(
        "get_mandatory_update_status"
      );
      if (softwareData?.success && mandatoryData?.success) {
        setSoftwareInfo({
          software_update_available: softwareData.status,
          mandatory_update: mandatoryData.status,
        });
      }
    };
    fetchDeviceInfo();
  }, []);

  const handleSoftwareUpdate = () => {
    setShowUpdateModal(true);
  };

  return (
    <>
      <Container
        header={
          <Header
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={
                    softwareInfo.software_update_available === null ||
                    softwareInfo.software_update_available === false
                  }
                  onClick={handleSoftwareUpdate}
                >
                  Update Software
                </Button>
              </SpaceBetween>
            }
            description="AWS DeepRacer vehicle 1/18th scale 4WD monster truck chassis"
          >
            About
          </Header>
        }
      >
        {/* TO DO: Some Hardcoded values, need to create an API */}
        {/* TO DO: Need to code software update modal */}
        <SpaceBetween direction="vertical" size="m">
          <KeyValuePairs
            columns={4}
            items={[
              {
                label: "Operating System",
                value:
                  deviceInfo.os_version + ", Intel® OpenVINO™ toolkit, " + deviceInfo.ros_distro,
              },
              {
                label: "Software Version",
                value:
                  deviceInfo.software_version === "Unknown" ? (
                    <StatusIndicator type="warning">Unknown</StatusIndicator>
                  ) : (
                    deviceInfo.software_version
                  ),
              },
              {
                label: "Software Update Available",
                value:
                  softwareInfo.software_update_available === null ? (
                    <StatusIndicator type="warning">Unknown</StatusIndicator>
                  ) : softwareInfo.software_update_available === true ? (
                    <StatusIndicator type="warning">Software update available</StatusIndicator>
                  ) : (
                    <StatusIndicator type="success">Software up to date</StatusIndicator>
                  ),
              },
              {
                label: "Mandatory Update",
                value: "-",
              },
              {
                label: "Hardware Version",
                value:
                  deviceInfo.hardware_version === "Unknown" ? (
                    <StatusIndicator type="warning">Unknown</StatusIndicator>
                  ) : (
                    deviceInfo.hardware_version
                  ),
              },
              { label: "Processor", value: deviceInfo.cpu_model },
              {
                label: "Memory",
                value: deviceInfo.ram_amount + " RAM/" + deviceInfo.disk_amount + " Storage",
              },
              { label: "Camera", value: "4MP with MJPEG" },
            ]}
          />
        </SpaceBetween>
      </Container>

      <SoftwareUpdateModal visible={showUpdateModal} onDismiss={() => setShowUpdateModal(false)} />
    </>
  );
};
