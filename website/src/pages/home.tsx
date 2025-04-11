import {
  Box,
  Button,
  ExpandableSection,
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
import { ApiHelper } from "../common/helpers/api-helper";
import { useModels } from "../common/hooks/use-models";
import { useAuth } from "../common/hooks/use-authentication";

// Add interfaces for API responses
interface SensorStatusResponse {
  success: boolean;
  camera_status: string;
  stereo_status: string;
  lidar_status: string;
}

interface DriveResponse {
  success: boolean;
}

const HomePage = () => {
  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [cameraFeedType, setCameraFeedType] = useState("mono");
  const [sensorStatus, setSensorStatus] = useState({
    camera_status: "not_connected",
    stereo_status: "not_connected",
    lidar_status: "not_connected",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [throttle, setThrottle] = useState(30);
  const [isInferenceRunning, setIsInferenceRunning] = useState(false);
  const lastJoystickMoveTime = useRef<number>(0);

  // Add state for tracking scrollbars
  const [defaultExpandCameraSection, setDefaultExpandCameraSection] = useState(true);
  const divLayoutRef = useRef<HTMLDivElement | null>(null);
  const [expandedCameraSection, setExpandedCameraSection] = useState(true);

  // Get all model-related data from context
  const { modelOptions, selectedModel, isModelLoaded, setSelectedModel, loadModel, reloadModels } =
    useModels();
  const { isAuthenticated } = useAuth();

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

  useEffect(() => {
    const initialize = async () => {
      await fetchSensorStatus();
      setDriveMode("auto");
    };

    initialize();

    return () => {
      handleStop();
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "+":
          handleAutoThrottle(1);
          break;
        case "-":
          handleAutoThrottle(-1);
          break;
        case "l":
          handleAutoThrottle(5);
          break;
        case "m":
          handleAutoThrottle(-5);
          break;
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  const handleReloadModels = async () => {
    if (isAuthenticated) {
      reloadModels();
    }
  };

  const setDriveMode = async (mode: "auto" | "manual") => {
    try {
      setIsInferenceRunning(false);
      const response = await ApiHelper.post<DriveResponse>("drive_mode", {
        drive_mode: mode,
      });
      console.log(`Drive mode set to ${mode}:`, response);

      if (response?.success && mode === "auto") {
        handleAutoThrottle(0);
      }
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
      const data = await ApiHelper.get<SensorStatusResponse>("get_sensor_status");
      if (data?.success) {
        setSensorStatus(data);
      }
    } catch (error) {
      console.error("Error fetching sensor status:", error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(fetchSensorStatus, 10000);

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
      if (cameraImgRef.current) {
        cameraImgRef.current.src = ""; // Clear camera feed source
      }
    };
  }, []);

  const toggleCameraFeed = () => {
    setShowCameraFeed((prevState) => !prevState);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleModelSelect = ({ detail }: { detail: any }) => {
    setSelectedModel(detail.selectedOption);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleStart = async () => {
    try {
      setIsInferenceRunning(true);
      const response = await ApiHelper.post<DriveResponse>("start_stop", {
        start_stop: "start",
      });
      console.log("Vehicle started:", response);
    } catch (error) {
      console.error("Error starting vehicle:", error);
    }
  };

  const handleStop = async () => {
    try {
      setIsInferenceRunning(false);
      const response = await ApiHelper.post<DriveResponse>("start_stop", {
        start_stop: "stop",
      });
      console.log("Vehicle stopped:", response);
    } catch (error) {
      console.error("Error stopping vehicle:", error);
    }
  };

  const handleAutoThrottle = (change: number) => {
    setThrottle((prevThrottle) => {
      const newThrottle = Math.round(prevThrottle + change);
      ApiHelper.post<DriveResponse>("max_nav_throttle", {
        throttle: newThrottle,
      });
      return newThrottle;
    });
  };

  const handleManualThrottle = (change: number) => {
    setThrottle((prevThrottle) => {
      return Math.round(prevThrottle + change);
    });
  };

  const handleLoadModelClick = async () => {
    handleStop();

    if (selectedModel) {
      setIsModalVisible(false);
      await loadModel(selectedModel.value);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJoystickMove = (event: any) => {
    const now = Date.now();
    //prevent joystick spamming the API and causing lag
    if (now - lastJoystickMoveTime.current < 200) return;

    lastJoystickMoveTime.current = now;
    const steering = event.x;
    const joy_throttle = event.y;
    console.log(`Joystick moved to x: ${steering}, y: ${joy_throttle}`);
    try {
      const modelResponse = axios.put(`/api/manual_drive`, {
        angle: steering,
        throttle: joy_throttle * -1,
        max_speed: throttle / 100.0,
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
      cameraFeedSrc =
        "route?topic=/object_detection_pkg/detection_display&width=480&height=360&qos_profile=sensor_data";
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
      // Any page-specific notifications can be passed as additionalNotifications
      // additionalNotifications={[{...}]}  // Only if you have page-specific notifications
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
                            <SpaceBetween size="xs" direction="horizontal" alignItems="center">
                              <Select
                                options={modelOptions}
                                selectedOption={selectedModel}
                                onChange={handleModelSelect}
                                placeholder="Select a reinforcement model"
                                expandToViewport
                                triggerVariant="option"
                              />
                              <Button
                                variant="normal"
                                onClick={handleReloadModels}
                                iconName="refresh"
                              />
                            </SpaceBetween>
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
                              onClick={() => handleAutoThrottle(-1)}
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
                                <path d="M76 56H20v-12h56v12z" fill="currentColor" />
                              </svg>
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleAutoThrottle(1)}
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
                                  d="M76 56H54v22h-12V56H20v-12h22V22h12v22h22v12z"
                                  fill="currentColor"
                                />
                              </svg>
                            </Button>
                          </SpaceBetween>
                          <Box variant="small" color="text-body-secondary">
                            Use -5 / +5 with caution, increased risk of crashing!
                          </Box>
                          <SpaceBetween size="l" direction="horizontal">
                            <Button
                              variant="normal"
                              onClick={() => handleAutoThrottle(-5)}
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
                                <text
                                  x="48"
                                  y="48"
                                  fill="currentColor"
                                  fontSize="80"
                                  fontFamily="'Open Sans', 'Helvetica Neue', Roboto, Arial, sans-serif"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                >
                                  -5
                                </text>
                              </svg>
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleAutoThrottle(5)}
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
                                <text
                                  x="48"
                                  y="48"
                                  fill="currentColor"
                                  fontSize="80"
                                  fontFamily="'Open Sans', 'Helvetica Neue', Roboto, Arial, sans-serif"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                >
                                  +5
                                </text>
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
                            onClick={() => handleManualThrottle(-1)}
                            data-testid="decrease-speed"
                          >
                            <svg
                              width="96"
                              height="96"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M76 56H20v-12h56v12z" fill="currentColor" />
                            </svg>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleManualThrottle(1)}
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
                                d="M76 56H54v22h-12V56H20v-12h22V22h12v22h22v12z"
                                fill="currentColor"
                              />
                            </svg>
                          </Button>
                        </SpaceBetween>
                        <Box variant="small" color="text-body-secondary">
                          Use -5 / +5 with caution, increased risk of crashing!
                        </Box>
                        <SpaceBetween size="l" direction="horizontal">
                          <Button
                            variant="normal"
                            onClick={() => handleManualThrottle(-5)}
                            data-testid="decrease-speed"
                          >
                            <svg
                              width="96"
                              height="96"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <text
                                x="48"
                                y="48"
                                fill="currentColor"
                                fontSize="80"
                                fontFamily="'Open Sans', 'Helvetica Neue', Roboto, Arial, sans-serif"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                -5
                              </text>
                            </svg>
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleManualThrottle(5)}
                            data-testid="increase-speed"
                          >
                            <svg
                              width="96"
                              height="96"
                              viewBox="0 0 96 96"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <text
                                x="48"
                                y="48"
                                fill="currentColor"
                                fontSize="80"
                                fontFamily="'Open Sans', 'Helvetica Neue', Roboto, Arial, sans-serif"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                +5
                              </text>
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
