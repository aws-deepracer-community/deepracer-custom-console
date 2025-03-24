import {
  Box,
  Button,
  ExpandableSection,
  FlashbarProps,
  Grid,
  Header,
  KeyValuePairs,
  Modal,
  ProgressBar,
  Select,
  SpaceBetween,
  Tabs,
  Toggle,
} from "@cloudscape-design/components";
import axios from "axios";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Joystick } from "react-joystick-component";
import BaseAppLayout from "../components/base-app-layout";

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
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const lastJoystickMoveTime = useRef<number>(0);

  // Add state for tracking scrollbars
  const [defaultExpandCameraSection, setDefaultExpandCameraSection] = useState(true);
  const divLayoutRef = useRef<HTMLDivElement | null>(null);
  const [expandedCameraSection, setExpandedCameraSection] = useState(true);

  // Check for scrollbars after render and on resize
  useLayoutEffect(() => {
    const checkForScrollbars = () => {
      if (divLayoutRef.current) {
        // Auto-collapse camera section on small screens
        if (divLayoutRef.current.scrollWidth < 902) {
          // 902px is the 's' breakpoint
          setDefaultExpandCameraSection(false);
          if (expandedCameraSection && defaultExpandCameraSection) {
            setExpandedCameraSection(false);
          }
        } else {
          setDefaultExpandCameraSection(true);
          if (!expandedCameraSection && !defaultExpandCameraSection) {
            setExpandedCameraSection(true);
          }
        }
      }
    };

    checkForScrollbars();
    window.addEventListener("resize", checkForScrollbars);

    return () => window.removeEventListener("resize", checkForScrollbars);
  }, [expandedCameraSection, defaultExpandCameraSection]);

  const checkInitialModelStatus = async () => {
    try {
      const response = await axios.get("api/isModelLoading");
      if (response.data.isModelLoading === "loaded") {
        setIsModelLoaded(true);
        const selectedModelName = localStorage.getItem("selectedModelName");
        if (selectedModelName) {
          setSelectedModel({ value: selectedModelName });
        }
      }
    } catch (error) {
      console.error("Error checking initial model status:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchSensorStatus();
      await fetchModels();
      await checkInitialModelStatus();
      setDriveMode("auto");
    };

    initialize();

    return () => {
      handleStop();
    };
  }, []);

  const setDriveMode = async (mode: "auto" | "manual") => {
    try {
      setIsInferenceRunning(false);
      const response = await axios.post("/api/drive_mode", {
        drive_mode: mode,
      });
      console.log(`Drive mode set to ${mode}:`, response.data);
    } catch (error) {
      console.error(`Error setting drive mode to ${mode}:`, error);
    }
  };

  const handleTabChange = (selectedTab: string) => {
    if (selectedTab === "autonomous") {
      setDriveMode("auto");
    } else if (selectedTab === "manual") {
      setDriveMode("manual");
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
      const response = await axios.get("/api/models");
      const models = response.data.models;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options = models.map((model: any) => ({
        label: model.model_folder_name,
        value: model.model_folder_name,
        description: model.model_sensors.join(", "),
        disabled: model.is_select_disabled,
      }));
      setModelOptions(options);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const toggleCameraFeed = () => {
    setShowCameraFeed((prevState) => !prevState);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleModelSelect = ({ detail }: { detail: any }) => {
    setSelectedModel(detail.selectedOption);
    setIsModalVisible(true);
    localStorage.setItem("selectedModelName", detail.selectedOption.value);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleStart = async () => {
    try {
      setIsInferenceRunning(true);
      const response = await axios.post("/api/start_stop", {
        start_stop: "start",
      });
      console.log("Vehicle started:", response.data);
    } catch (error) {
      console.error("Error starting vehicle:", error);
    }
  };

  const handleStop = async () => {
    try {
      setIsInferenceRunning(false);
      const response = await axios.post("/api/start_stop", {
        start_stop: "stop",
      });
      console.log("Vehicle stopped:", response.data);
    } catch (error) {
      console.error("Error stopping vehicle:", error);
    }
  };

  const handleThrottle = (direction: "up" | "down") => {
    setThrottle((prevThrottle) => {
      if (direction === "up") {
        try {
          const response = axios.post("/api/max_nav_throttle", {
            throttle: prevThrottle + 1,
          });
          console.log("Vehicle stopped:", response);
        } catch (error) {
          console.error("Error stopping vehicle:", error);
        }
        return prevThrottle + 1;
      } else if (direction === "down") {
        try {
          const response = axios.post("/api/max_nav_throttle", {
            throttle: prevThrottle - 1,
          });
          console.log("Vehicle stopped:", response);
        } catch (error) {
          console.error("Error stopping vehicle:", error);
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
        console.log("Model API response:", modelResponse.data);
        setIsModalVisible(false);
        setIsModelLoaded(false);
        showLoadingFlashbar();
        pollModelLoadingStatus();
      } else {
        console.error("No model selected");
      }
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  const pollModelLoadingStatus = async () => {
    try {
      const response = await axios.get("api/isModelLoading");
      if (response.data.isModelLoading === "loaded" && response.data.success) {
        showSuccessFlashbar();
        setIsModelLoaded(true);
      } else {
        setTimeout(pollModelLoadingStatus, 1000);
      }
    } catch (error) {
      console.error("Error polling model loading status:", error);
      setTimeout(pollModelLoadingStatus, 1000);
    }
  };

  const showLoadingFlashbar = () => {
    setFlashbarItems([
      {
        type: "in-progress",
        loading: true,
        content: "Model loading...",
        dismissible: false,
      },
    ]);
  };

  const showSuccessFlashbar = () => {
    setFlashbarItems([
      {
        type: "success",
        content: "Model loaded successfully",
        dismissible: true,
        onDismiss: () => setFlashbarItems([]),
      },
    ]);
    setTimeout(() => setFlashbarItems([]), 5000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJoystickMove = (event: any) => {
    const now = Date.now();
    //prevent joystick spamming the API and causing lag
    if (now - lastJoystickMoveTime.current < 200) return;

    lastJoystickMoveTime.current = now;
    const steering = event.x;
    const throttle = event.y;
    console.log(`Joystick moved to x: ${steering}, y: ${throttle}`);
    try {
      const modelResponse = axios.put(`/api/manual_drive`, {
        angle: steering,
        throttle: throttle,
        max_speed: 0.5,
      });
      console.log("Model API response:", modelResponse);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  const handleToggleChange = (sensorType: string) => {
    setCameraFeedType(sensorType);
  };

  const cameraStatusText =
    sensorStatus.camera_status === "connected" ? "(Connected)" : "(Not Connected)";
  const stereoStatusText =
    sensorStatus.stereo_status === "connected" ? "(Connected)" : "(Not Connected)";
  const lidarStatusText =
    sensorStatus.lidar_status === "connected" ? "(Connected)" : "(Not Connected)";

  let cameraFeedSrc;
  switch (cameraFeedType) {
    case "stereo":
      cameraFeedSrc = "route?topic=/object_detection_pkg/detection_display&width=480&height=360&qos_profile=sensor_data";
      break;
    case "lidar":
      cameraFeedSrc =
        "route?topic=/sensor_fusion_pkg/overlay_msg&width=480&height=360&qos_profile=sensor_data";
      break;
    default:
      cameraFeedSrc =
        "route?topic=/camera_pkg/display_mjpeg&width=480&height=360&qos_profile=sensor_data";
  }
  const cameraImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (showCameraFeed && cameraImgRef.current) {
      cameraImgRef.current.src = cameraFeedSrc;
    } else if (!showCameraFeed && cameraImgRef.current) {
      cameraImgRef.current.src = "";
    }
  }, [showCameraFeed, cameraFeedSrc]);

  return (
    <BaseAppLayout
      pageNotifications={flashbarItems}
      content={
        <div ref={divLayoutRef}>
          <SpaceBetween size="l">
            <Header variant="h1">Control Vehicle</Header>
            <Grid
              gridDefinition={[
                { colspan: { default: 12, m: 7, s: 7 } },
                { colspan: { default: 12, m: 5, s: 5 } },
              ]}
            >
              <ExpandableSection
                variant="container"
                headerText="Camera Feed"
                headingTagOverride="h2"
                expanded={expandedCameraSection}
                defaultExpanded={defaultExpandCameraSection}
                onChange={({ detail }) => setExpandedCameraSection(detail.expanded)}
              >
                <SpaceBetween size="s">
                  <div
                    style={{
                      border: "1px solid #d5dbdb",
                      backgroundColor: "#f2f3f3",
                      overflow: "hidden",
                      borderRadius: "4px",
                      padding: showCameraFeed ? "0" : "0",
                      width: "482px",
                      height: "362px",
                    }}
                  >
                    <img
                      ref={cameraImgRef}
                      width="482"
                      height="362"
                      style={{ border: "none", display: showCameraFeed ? "block" : "none" }}
                    />
                  </div>
                  <KeyValuePairs
                    columns={3}
                    items={[
                      {
                        label: "Mono Camera",
                        value: (
                          <Toggle
                            onChange={() => {
                              handleToggleChange("mono");
                              toggleCameraFeed();
                            }}
                            checked={cameraFeedType === "mono" && showCameraFeed}
                            disabled={sensorStatus.camera_status === "not_connected"}
                          >
                            {cameraStatusText}
                          </Toggle>
                        ),
                      },
                      {
                        label: "Stereo Camera",
                        value: (
                          <Toggle
                            onChange={() => {
                              handleToggleChange("stereo");
                              toggleCameraFeed();
                            }}
                            checked={cameraFeedType === "stereo" && showCameraFeed}
                            disabled={sensorStatus.stereo_status === "not_connected"}
                          >
                            {stereoStatusText}
                          </Toggle>
                        ),
                      },
                      {
                        label: "LiDAR",
                        value: (
                          <Toggle
                            onChange={() => {
                              handleToggleChange("lidar");
                              toggleCameraFeed();
                            }}
                            checked={cameraFeedType === "lidar" && showCameraFeed}
                            disabled={sensorStatus.lidar_status === "not_connected"}
                          >
                            {lidarStatusText}
                          </Toggle>
                        ),
                      },
                    ]}
                  />
                </SpaceBetween>
              </ExpandableSection>

              <Tabs
                onChange={({ detail }) => handleTabChange(detail.activeTabId)}
                tabs={[
                  {
                    label: "Autonomous Mode",
                    id: "autonomous",
                    content: (
                      <>
                        <SpaceBetween size="m" direction="vertical">
                          <Header variant="h2">Model</Header>
                          <SpaceBetween size="xxs" direction="vertical">
                            <Box color="text-body-secondary">
                              Choose a model to autonomously drive
                            </Box>
                            <Select
                              options={modelOptions}
                              selectedOption={selectedModel}
                              onChange={handleModelSelect}
                              placeholder="Select a model"
                              expandToViewport
                              triggerVariant="option"
                            />
                            <Box variant="small" color="text-body-secondary">
                              Vehicle's sensor configuration must match the model's sensor
                              configuration to enable autonomous driving.
                            </Box>
                          </SpaceBetween>
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
                                    <Button variant="primary" onClick={handleLoadModelClick}>
                                      Load Model
                                    </Button>
                                  </SpaceBetween>
                                </Box>
                              }
                            >
                              <Box variant="p">
                                Your vehicle will be disabled while the new model is loaded
                              </Box>
                            </Modal>
                          )}
                          <Header variant="h2">Control Vehicle</Header>
                          <SpaceBetween size="l" direction="horizontal">
                            <Button
                              variant="primary"
                              data-testid="start-vehicle"
                              onClick={handleStart}
                              disabled={!isModelLoaded || isInferenceRunning}
                            >
                              Start vehicle
                            </Button>
                            <Button
                              variant="normal"
                              data-testid="stop-vehicle"
                              onClick={handleStop}
                              disabled={!isModelLoaded || !isInferenceRunning}
                            >
                              Stop vehicle
                            </Button>
                          </SpaceBetween>

                          <ProgressBar
                            value={throttle}
                            additionalInfo="All speeds are multiplied with the factor. If the car does not move, then gradually increase the factor."
                            label="Adjust speed factor"
                          />
                          <SpaceBetween size="l" direction="horizontal">
                            <Button
                              variant="normal"
                              onClick={() => handleThrottle("down")}
                              data-testid="decrease-speed"
                              disabled={!isModelLoaded}
                            >
                              <svg
                                width="96"
                                height="96"
                                viewBox="0 0 96 96"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M76 52H20v-8h56v8z" fill="currentColor" />
                              </svg>
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleThrottle("up")}
                              data-testid="increase-speed"
                              disabled={!isModelLoaded}
                            >
                              <svg
                                width="96"
                                height="96"
                                viewBox="0 0 96 96"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M76 52H52v24h-8V52H20v-8h24V20h8v24h24v8z"
                                  fill="currentColor"
                                />
                              </svg>
                            </Button>
                          </SpaceBetween>
                        </SpaceBetween>
                      </>
                    ),
                  },
                  {
                    label: "Manual Mode",
                    id: "manual",
                    content: (
                      <SpaceBetween size="m" direction="vertical">
                        <Header variant="h2">Drive</Header>
                        <Box color="text-body-secondary">
                          Drive the vehicle manually using the joystick
                        </Box>
                        <Box textAlign="center" padding={{ top: "m", bottom: "m" }}>
                          <div style={{ justifyContent: "center", display: "flex" }}>
                            <Joystick
                              size={100}
                              baseColor="#eaeded"
                              stickColor="#545b64"
                              start={handleStart}
                              move={handleJoystickMove}
                              stop={handleStop}
                            />
                          </div>
                        </Box>

                        <Header variant="h2">Speed</Header>
                        <ProgressBar
                          value={throttle}
                          additionalInfo="All speeds are multiplied with the factor. If the car does not move, then gradually increase the factor."
                          label="Adjust speed factor"
                        />
                        <SpaceBetween size="l" direction="horizontal">
                          <Button
                            variant="normal"
                            onClick={() => handleThrottle("down")}
                            data-testid="decrease-speed"
                          >
                            <svg
                              width="96"
                              height="96"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M76 52H20v-8h56v8z" fill="currentColor" />
                            </svg>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleThrottle("up")}
                            data-testid="increase-speed"
                          >
                            <svg
                              width="96"
                              height="96"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M76 52H52v24h-8V52H20v-8h24V20h8v24h24v8z"
                                fill="currentColor"
                              />
                            </svg>
                          </Button>
                        </SpaceBetween>
                      </SpaceBetween>
                    ),
                  },
                ]}
                variant="container"
              />
            </Grid>
          </SpaceBetween>
        </div>
      }
    />
  );
};

export default HomePage;
