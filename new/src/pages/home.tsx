import { Component } from "react";
import { TextContent, Toggle, RadioGroup,} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Tabs from "@cloudscape-design/components/tabs";
import Select from "@cloudscape-design/components/select";

interface HomeState {
  showCameraFeed: boolean;
  cameraFeedType: string;
  sensorStatus: {
    camera_status: string;
    stereo_status: string;
    lidar_status: string;
  };
}

class HomePage extends Component<{}, HomeState> {
  state: HomeState = {
    showCameraFeed: false,
    cameraFeedType: "mono",
    sensorStatus: {
      camera_status: "not_connected",
      stereo_status: "not_connected",
      lidar_status: "not_connected",
    },
  };

  componentDidMount() {
    this.fetchSensorStatus();
  }

  fetchSensorStatus = async () => {
    try {
      const response = await fetch("/api/get_sensor_status");
      const data = await response.json();
      if (data.success) {
        this.setState({ sensorStatus: data });
      }
    } catch (error) {
      console.error("Error fetching sensor status:", error);
    }
  };

  toggleCameraFeed = () => {
    this.setState((prevState) => ({
      showCameraFeed: !prevState.showCameraFeed,
    }));
  };

  handleCameraFeedTypeChange = ({ detail }: { detail: any }) => {
    this.setState({ cameraFeedType: detail.value });
  };

  render() {
    const { showCameraFeed, cameraFeedType, sensorStatus } = this.state;

    const cameraStatusText = sensorStatus.camera_status === 'connected' ? '(Connected)' : '(Not Connected)';
    const stereoStatusText = sensorStatus.stereo_status === 'connected' ? '(Connected)' : '(Not Connected)';
    const lidarStatusText = sensorStatus.lidar_status === 'connected' ? '(Connected)' : '(Not Connected)';

    let cameraFeedSrc;
    switch (cameraFeedType) {
      case "stereo":
        cameraFeedSrc = "route?topic=/object_detection_pkg/detection_display&width=480&height=360";
        break;
      case "lidar":
        cameraFeedSrc = "route?topic=/sensor_fusion_pkg/overlay_msg&width=480&height=360";
        break;
      default:
        cameraFeedSrc = "route?topic=/camera_pkg/display_mjpeg&width=480&height=360";
    }

    return (
      <BaseAppLayout
        content={
          <div>
            <TextContent>
              <h1>Control Vehicle</h1>
              <h2>Sensor</h2>
              <div style={{ display: 'flex', alignItems: 'right', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: "482px",
                  height: "362px",
                  border: "1px solid #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0",
                  overflow: "hidden",
                }}
              >
                {showCameraFeed ? (
                  <iframe
                    src={cameraFeedSrc}
                    width="482"
                    height="362"
                    frameBorder="0"
                    allowFullScreen={true}
                    title="Video Feed"
                    style={{ border: "none" }}
                  ></iframe>
                ) : (
                  <p>Camera feed is off</p>
                )}
              </div>
              <Tabs 
              tabs={[
                {
                  label: "Autonomous Mode",
                  id: "first",
                  content: 
                  <div>
                  <h2>Models</h2>
                  <p>Choose a model to autonomously drive</p>
                  <Select
                    options={[
                      { label: "Option 1", value: "1" },
                      { label: "Option 2", value: "2" },
                      { label: "Option 3", value: "3" },
                      { label: "Option 4", value: "4" },
                      { label: "Option 5", value: "5" }
                    ]}
                  />
                  </div>
                },
                {
                  label: "Manual Model",
                  id: "second",
                  content:
                  <div>
                  <h2>Drive</h2>
                  <p>Drive the vehicle manually using the joystick</p>
                  </div>
                }
              ]}
              variant="container"
            />
              </div>
              <Toggle
                onChange={this.toggleCameraFeed}
                checked={showCameraFeed}
              >
                {showCameraFeed ? "Turn Off Camera" : "Turn On Camera"}
              </Toggle>            <RadioGroup
              onChange={this.handleCameraFeedTypeChange}
              value={cameraFeedType}
              items={[
                {
                  value: "mono",
                  label: `Mono Camera ${cameraStatusText}`,
                  disabled: sensorStatus.camera_status === "not_connected",
                },
                {
                  value: "stereo",
                  label: `Stereo Camera ${stereoStatusText}`,
                  disabled: sensorStatus.stereo_status === "not_connected",
                },
                {
                  value: "lidar",
                  label: `LiDAR ${lidarStatusText}`,
                  disabled: sensorStatus.lidar_status === "not_connected",
                },
              ]}
              />
            </TextContent>
          </div>
        }
      />
    );
  }
}

export default HomePage;