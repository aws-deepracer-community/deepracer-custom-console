import { useEffect, useState } from 'react';
import { TextContent, Toggle, RadioGroup } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Tabs from "@cloudscape-design/components/tabs";
import Select from "@cloudscape-design/components/select";
import axios from 'axios';

const HomePage = () => {
  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [cameraFeedType, setCameraFeedType] = useState("mono");
  const [sensorStatus, setSensorStatus] = useState({
    camera_status: "not_connected",
    stereo_status: "not_connected",
    lidar_status: "not_connected",
  });
  const [modelOptions, setModelOptions] = useState([]);

  useEffect(() => {
    fetchSensorStatus();
    fetchModels();
  }, []);

  const fetchSensorStatus = async () => {
    try {
      const response = await fetch("/api/get_sensor_status");
      const data = await response.json();
      if (data.success) {
        setSensorStatus(data);
      }
    } catch (error) {
      console.error("Error fetching sensor status:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      const models = response.data.models;
      const options = models.map(model => ({
        label: model.model_folder_name,
        value: model.model_folder_name,
        description: model.model_sensors.join(', '),
        disabled: model.is_select_disabled
      }));
      setModelOptions(options);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const toggleCameraFeed = () => {
    setShowCameraFeed(prevState => !prevState);
  };

  const handleCameraFeedTypeChange = ({ detail }: { detail: any }) => {
    setCameraFeedType(detail.value);
  };

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
                  options={modelOptions}
                  selectedOption={modelOptions[0]}
                  onChange={({ detail }) => setModelOptions(detail.selectedOption)}
                  placeholder="Select a model"
                />
                <p>Sensor and vehicle configuration must match</p>
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
              onChange={toggleCameraFeed}
              checked={showCameraFeed}
            >
              {showCameraFeed ? "Turn Off Camera" : "Turn On Camera"}
            </Toggle>            <RadioGroup
            onChange={handleCameraFeedTypeChange}
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
};

export default HomePage;