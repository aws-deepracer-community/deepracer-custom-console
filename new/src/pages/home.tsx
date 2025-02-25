import { useEffect, useState, useRef } from 'react';
import { TextContent, Toggle, Modal, Button, Flashbar, FlashbarProps } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Tabs from "@cloudscape-design/components/tabs";
import Select from "@cloudscape-design/components/select";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import axios from 'axios';
import { Joystick } from 'react-joystick-component';
import Container from "@cloudscape-design/components/container";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";

const HomePage = () => {
  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [cameraFeedType, setCameraFeedType] = useState("mono");
  const [sensorStatus, setSensorStatus] = useState({
    camera_status: "not_connected",
    stereo_status: "not_connected",
    lidar_status: "not_connected",
  });
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState<{ value: string } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [flashbarItems, setFlashbarItems] = useState<FlashbarProps.MessageDefinition[]>([]);
  const [throttle, setThrottle] = useState(30);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const lastJoystickMoveTime = useRef<number>(0);

  const checkInitialModelStatus = async () => {
    try {
      const response = await axios.get('api/isModelLoading');
      if (response.data.isModelLoading === 'loaded') {
        setIsModelLoaded(true);
        const selectedModelName = localStorage.getItem('selectedModelName');
        if (selectedModelName) {
          setSelectedModel({ value: selectedModelName });
        }
      }
    } catch (error) {
      console.error('Error checking initial model status:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchSensorStatus();
      await fetchModels();
      await checkInitialModelStatus();
      setDriveMode('auto');
    };
    
    initialize();

    return () => {
      handleStop();
    };
  }, []);

  const setDriveMode = async (mode: 'auto' | 'manual') => {
    try {
      const response = await axios.post('/api/drive_mode', { drive_mode: mode });
      console.log(`Drive mode set to ${mode}:`, response.data);
    } catch (error) {
      console.error(`Error setting drive mode to ${mode}:`, error);
    }
  };

  const handleTabChange = (selectedTab: string) => {
    if (selectedTab === 'autonomous') {
      setDriveMode('auto');
    } else if (selectedTab === 'manual') {
      setDriveMode('manual');
    }
  };

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
      const options = models.map((model: any) => ({
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

  const handleModelSelect = ({ detail }: { detail: any }) => {
    setSelectedModel(detail.selectedOption);
    setIsModalVisible(true);
    localStorage.setItem('selectedModelName', detail.selectedOption.value);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleStart = async () => {
    try {
      const response = await axios.post('/api/start_stop', { start_stop: 'start' });
      console.log('Vehicle started:', response.data);
    } catch (error) {
      console.error('Error starting vehicle:', error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await axios.post('/api/start_stop', { start_stop: 'stop' });
      console.log('Vehicle stopped:', response.data);
    } catch (error) {
      console.error('Error stopping vehicle:', error);
    }
  };

  const handleThrottle = (direction: 'up' | 'down') => {
    setThrottle(prevThrottle => {
      if (direction === 'up') {
        try {
          const response = axios.post('/api/max_nav_throttle', { throttle: prevThrottle + 1 });
          console.log('Vehicle stopped:', response);
        } catch (error) {
          console.error('Error stopping vehicle:', error);
        }
        return prevThrottle + 1;
      } else if (direction === 'down') {
        try {
          const response = axios.post('/api/max_nav_throttle', { throttle: prevThrottle - 1 });
          console.log('Vehicle stopped:', response);
        } catch (error) {
          console.error('Error stopping vehicle:', error);
        }
        return prevThrottle - 1;
      }
      return prevThrottle;
    });
  };

  const handleLoadModelClick = async () => {
    try {
        handleStop();

        if (selectedModel) {
            const modelResponse = await axios.put(`/api/models/${selectedModel.value}/model`);
            console.log('Model API response:', modelResponse.data);
            setIsModalVisible(false);
            setIsModelLoaded(false);
            showLoadingFlashbar();
            pollModelLoadingStatus();
        } else {
            console.error('No model selected');
        }
    } catch (error) {
        console.error('Error calling API:', error);
    }
  };

  const pollModelLoadingStatus = async () => {
    try {
        const response = await axios.get('api/isModelLoading');
        if (response.data.isModelLoading === 'loaded' && response.data.success) {
            showSuccessFlashbar();
            setIsModelLoaded(true);
        } else {
            setTimeout(pollModelLoadingStatus, 1000);
        }
    } catch (error) {
        console.error('Error polling model loading status:', error);
        setTimeout(pollModelLoadingStatus, 1000);
    }
  };

  const showLoadingFlashbar = () => {
    setFlashbarItems([{
      type: 'in-progress',
      content: 'Model Loading...',
      dismissible: false,
    }]);
  };

  const showSuccessFlashbar = () => {
    setFlashbarItems([{
      type: 'success',
      content: 'Model loaded successfully',
      dismissible: true,
      onDismiss: () => setFlashbarItems([]),
    }]);
    setTimeout(() => setFlashbarItems([]), 5000);
  };

  const handleJoystickMove = (event: any) => {
    const now = Date.now();
    //prevent joystick spamming the API and causing lag
    if (now - lastJoystickMoveTime.current < 200) return;

    lastJoystickMoveTime.current = now;
    const { x, y } = event;
    const steering = x;
    const throttle = y;
    console.log(`Joystick moved to x: ${x}, y: ${y}`);
    try {
      const modelResponse = axios.put(`/api/manual_drive`, { angle: steering, throttle: throttle, max_speed: 0.5 });
      console.log('Model API response:', modelResponse);
    } catch (error) {
      console.error('Error calling API:', error);
    }
  };

  const handleToggleChange = (sensorType: string) => {
    setCameraFeedType(sensorType);
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
          <Flashbar items={flashbarItems} />
          <TextContent>
            <h1>Control Vehicle</h1>
            <h2>Sensor</h2>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '20px',
              alignItems: 'flex-start',
              justifyContent: 'left'
            }}>

            <Container
              header={<h2>Camera Feed</h2>}
            >
              <SpaceBetween size="l">
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
                <KeyValuePairs
                          columns={3}
                          items={[
                            { label: "Mono Camera", value: (
                              <Toggle
                                onChange={() => { handleToggleChange('mono'); toggleCameraFeed(); }}
                                checked={cameraFeedType === 'mono' && showCameraFeed}
                                disabled={sensorStatus.camera_status === "not_connected"}
                              >
                                {cameraStatusText}
                              </Toggle>
                            ) },
                            { label: "Stereo Camera", value: (
                              <Toggle
                                onChange={() => { handleToggleChange('stereo'); toggleCameraFeed(); }}
                                checked={cameraFeedType === 'stereo' && showCameraFeed}
                                disabled={sensorStatus.stereo_status === "not_connected"}
                              >
                                {stereoStatusText}
                              </Toggle>
                            ) },
                            { label: "LiDAR", value: (
                              <Toggle
                                onChange={() => { handleToggleChange('lidar'); toggleCameraFeed(); }}
                                checked={cameraFeedType === 'lidar' && showCameraFeed}
                                disabled={sensorStatus.lidar_status === "not_connected"}
                              >
                                {lidarStatusText}
                              </Toggle>
                            ) }
                          ]}
                        />
              </SpaceBetween>
            </Container>
            <Tabs 
            onChange={({ detail }) => handleTabChange(detail.activeTabId)}
            tabs={[
              {
                label: "Autonomous Mode",
                id: "autonomous",
                content: 
                <div>
                <h2>Models</h2>
                <p>Choose a model to autonomously drive</p>
                <Select
                  options={modelOptions}
                  selectedOption={selectedModel}
                  onChange={handleModelSelect}
                  placeholder="Select a model"
                />
                <p>Sensor and vehicle configuration must match</p>
                {isModalVisible && (
                  <Modal
                    onDismiss={handleCancel}
                    visible={isModalVisible}
                    closeAriaLabel="Close modal"
                    header="Load Model"
                    footer={
                      <Box float="right">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button onClick={handleCancel}>Cancel</Button>
                        <Button variant="primary" onClick={handleLoadModelClick}>Load Model</Button>
                      </SpaceBetween>
                      </Box>
                    }
                  >
                    <TextContent>
                      <p>Your vehicle will be disabled while the new model is loaded</p>
                    </TextContent>
                  </Modal>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button 
                    variant="primary" 
                    fullWidth 
                    data-size="large-button-start" 
                    onClick={handleStart} 
                    disabled={!isModelLoaded} 
                  >
                    Start vehicle
                  </Button>
                  <Button 
                    variant="primary" 
                    fullWidth 
                    data-size="large-button-stop" 
                    onClick={handleStop} 
                    disabled={!isModelLoaded} 
                  >
                    Stop vehicle
                  </Button>
                </div>
                <h2>Speed</h2>
                <p>Adjust maximum speed {throttle}%</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                <Button 
                  variant="primary" 
                  onClick={() => handleThrottle('down')} 
                  data-size="large-button"
                  fullWidth
                  disabled={!isModelLoaded}
                >
                  -
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleThrottle('up')} 
                  data-size="large-button"
                  fullWidth
                  disabled={!isModelLoaded}
                >
                  +
                </Button>
                </div>
                </div>
              },
              {
                label: "Manual Mode",
                id: "manual",
                content:
                <div>
                <h2>Drive</h2>
                <p>Drive the vehicle manually using the joystick</p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '10px'
                }}>
                  <Joystick
                    size={100}
                    baseColor="gray"
                    stickColor="black"
                    start={handleStart}
                    move={handleJoystickMove}
                    stop={handleStop}
                  />
                </div>
                <h2>Speed</h2>
                <p>Adjust maximum speed {throttle}%</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                <Button 
                  variant="primary" 
                  onClick={() => handleThrottle('down')} 
                  data-size="large-button"
                  fullWidth
                >
                  -
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleThrottle('up')} 
                  data-size="large-button"
                  fullWidth
                >
                  +
                </Button>
                </div>
                </div>
              }
            ]}
            variant="container"
          />
            </div>
          </TextContent>
        </div>
      }
    />
  );
};

export default HomePage;