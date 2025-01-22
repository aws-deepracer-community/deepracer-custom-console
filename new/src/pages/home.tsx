import React, { Component } from "react";
import { TextContent, Toggle, RadioGroup } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";

class HomePage extends Component {
  state = {
    showCameraFeed: false,
    cameraFeedType: "mono",
    sensorStatus: {
      camera_status: "unknown",
      lidar_status: "unknown",
      stereo_status: "unknown",
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

  handleCameraFeedTypeChange = ({ detail }) => {
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
          <TextContent>
            <h1>Control Vehicle</h1>
            <h2>Sensor</h2>
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
            <Toggle
              onChange={this.toggleCameraFeed}
              checked={showCameraFeed}
            >
              {showCameraFeed ? "Turn Off Camera" : "Turn On Camera"}
            </Toggle>
            <RadioGroup
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
        }
      />
    );
  }
}

export default HomePage;