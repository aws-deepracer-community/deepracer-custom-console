import { useEffect, useState, useRef } from "react";
import {
  Container,
  Grid,
  Button,
  SpaceBetween,
  Header,
  Box,
  Alert,
  Toggle,
  Slider,
} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import { ApiHelper } from "../common/helpers/api-helper";
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import { useNavigate } from "react-router-dom";

// Add interfaces for API responses
interface CalibrationResponse {
  success: boolean;
  mid: string;
  max: string;
  min: string;
  polarity?: string;
}

interface AdjustWheelsResponse {
  success: boolean;
}

const handleStop = async () => {
  await ApiHelper.post<CalibrationResponse>("start_stop", { start_stop: "stop" });
};
const handleStart = async () => {
  await ApiHelper.post<CalibrationResponse>("start_stop", { start_stop: "start" });
};

const setCalibration = async () => {
  await ApiHelper.get<CalibrationResponse>("set_calibration_mode");
};

const getCalibrationThrottle = async () => {
  return await ApiHelper.get<CalibrationResponse>("get_calibration/throttle");
};

const setCalibrationThrottle = async (
  stopped: number,
  forward: number,
  backward: number,
  polar: number
) => {
  return await ApiHelper.post<CalibrationResponse>("set_calibration/throttle", {
    mid: stopped,
    min: polar == 1 ? backward : -forward,
    max: polar == 1 ? forward : -backward,
    polarity: polar,
  });
};

const adjustCalibratingWheelsThrottle = async (throttleValue: number) => {
  return await ApiHelper.post<AdjustWheelsResponse>("adjust_calibrating_wheels/throttle", {
    pwm: throttleValue,
  });
};

export default function RecalibrateSpeedPage() {
  const [activeAnchor, setActiveAnchor] = useState("#raise");
  const [stoppedValue, setStoppedValue] = useState(0);
  const [forwardValue, setForwardValue] = useState(0);
  const [backwardValue, setBackwardValue] = useState(0);
  const [polarity, setPolarity] = useState(0);
  const navigate = useNavigate();

  const [originalStopped, setOriginalStopped] = useState(0);

  const lastUpdateTime = useRef<number>(0);
  const actionRef = useRef(false);

  const [forwardDirectionSpeed, setForwardDirectionSpeed] = useState(10);

  const handleStoppedSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setStoppedValue(detail.value);
    adjustCalibratingWheelsThrottle(detail.value);
  };

  const handleDirectionSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setForwardDirectionSpeed(detail.value);
    adjustCalibratingWheelsThrottle(detail.value);
  };

  const handleForwardSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setForwardValue(detail.value);
    adjustCalibratingWheelsThrottle(detail.value);
  };

  const handleBackwardSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setBackwardValue(detail.value);
    adjustCalibratingWheelsThrottle(detail.value);
  };

  const handleStoppedSliderLeft = () => {
    setStoppedValue((prev) => {
      const newValue = Math.max(prev - 1, -30);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleStoppedSliderRight = () => {
    setStoppedValue((prev) => {
      const newValue = Math.min(prev + 1, 30);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleForwardSliderLeft = () => {
    setForwardValue((prev) => {
      const newValue = Math.max(prev - 1, getAdjustedRange(0));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleForwardSliderRight = () => {
    setForwardValue((prev) => {
      const newValue = Math.min(prev + 1, getAdjustedRange(50));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleBackwardSliderLeft = () => {
    setBackwardValue((prev) => {
      const newValue = Math.max(prev - 1, getAdjustedRange(-50));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleBackwardSliderRight = () => {
    setBackwardValue((prev) => {
      const newValue = Math.min(prev + 1, getAdjustedRange(0));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleDirectionSliderLeft = () => {
    setForwardDirectionSpeed((prev) => {
      const newValue = Math.max(prev - 1, 0);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleDirectionSliderRight = () => {
    setForwardDirectionSpeed((prev) => {
      const newValue = Math.min(prev + 1, 50);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  useEffect(() => {
    const fetchCalibrationValues = async () => {
      const calibrationData = await getCalibrationThrottle();
      if (calibrationData) {
        setStoppedValue(parseFloat(calibrationData.mid));
        setForwardValue(Math.abs(parseFloat(calibrationData.max))); // Show absolute value initially
        setBackwardValue(-Math.abs(parseFloat(calibrationData.min))); // Show negative value initially
        setPolarity(calibrationData.polarity ? parseInt(calibrationData.polarity, 10) : 0);
        setOriginalStopped(parseFloat(calibrationData.mid));
        setChecked(parseInt(calibrationData.polarity || "0", 10) === -1);
      }
    };
    fetchCalibrationValues();
    setCalibration();
    window.location.hash = "#raise";
    setActiveAnchor("#raise");
  }, []);

  useEffect(() => {
    return () => {
      if (!actionRef.current) {
        console.log("Abort speed calibration. Resetting throttle to original zero value.");
        adjustCalibratingWheelsThrottle(originalStopped);
        handleStop();
      }
    };
  }, [originalStopped]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAnchor(window.location.hash);
      if (window.location.hash === "#stopped") {
        handleStart();
        adjustCalibratingWheelsThrottle(stoppedValue);
      } else if (window.location.hash === "#direction") {
        adjustCalibratingWheelsThrottle(forwardDirectionSpeed);
      } else if (window.location.hash === "#forward") {
        adjustCalibratingWheelsThrottle(forwardValue);
      } else if (window.location.hash === "#backward") {
        adjustCalibratingWheelsThrottle(backwardValue);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [stoppedValue, forwardDirectionSpeed, forwardValue, backwardValue]);

  const anchors = [
    {
      text: "Raise your vehicle",
      href: "#raise",
      level: 1,
    },
    {
      text: "Calibrate stopped speed",
      href: "#stopped",
      level: 1,
    },
    {
      text: "Set forward direction",
      href: "#direction",
      level: 1,
    },
    {
      text: "Calibrate maximum forward speed",
      href: "#forward",
      level: 1,
    },
    {
      text: "Calibrate maximum backward speed",
      href: "#backward",
      level: 1,
    },
  ];

  const handleNavigation = (direction: string) => {
    const currentIndex = anchors.findIndex((anchor) => anchor.href === activeAnchor);
    if (direction === "next" && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === "previous" && currentIndex > 0) {
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const handleCancel = async () => {
    actionRef.current = true;
    console.log("Cancel speed calibration. Resetting throttle to original zero value.");
    await adjustCalibratingWheelsThrottle(originalStopped);
    navigate("/calibration");
  };

  const handleDone = async () => {
    actionRef.current = true;
    console.log(
      "Saved speed calibration. Max forward speed:",
      forwardValue,
      "Stopped value:",
      stoppedValue,
      "Max backward speed:",
      backwardValue,
      "Polarity:",
      polarity
    );
    await setCalibrationThrottle(stoppedValue, forwardValue, backwardValue, polarity);
    await adjustCalibratingWheelsThrottle(stoppedValue);
    navigate("/calibration");
  };

  const [checked, setChecked] = useState(false);

  const handleToggleChange = ({ detail }: { detail: { checked: boolean } }) => {
    setChecked(detail.checked);
    setPolarity(detail.checked ? -1 : 1);
  };

  const getAdjustedRange = (baseValue: number) => {
    return checked ? baseValue - stoppedValue : baseValue + stoppedValue;
  };

  const getReferenceValues = (min: number, max: number) => {
    const step = (max - min) / 5;
    return [min + step, min + 2 * step, min + 3 * step, min + 4 * step];
  };

  return (
    <BaseAppLayout
      content={
        <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
          <div>
            <Header variant="h3">
              <span id="navigation-header">Steps</span>
            </Header>
            <AnchorNavigation
              anchors={anchors.map((anchor) => ({
                ...anchor,
                className: anchor.href === activeAnchor ? "" : "greyed-out",
              }))}
            />
          </div>
          <Container>
            {activeAnchor === "#raise" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Speed Recalibration</Header>
                    <Header variant="h2">Raise vehicle</Header>
                    <Box variant="p">
                      Raise your vehicle to keep wheels from touching the ground and to key them
                      moving freely.
                    </Box>
                    <Alert
                      statusIconAriaLabel="Warning"
                      type="warning"
                      header="Wheels spin at high speeds"
                    >
                      Raise your vehicle on a stable surface when calibrating speed
                    </Alert>
                    <p />
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_raised_ground.svg" alt="Raise Vehicle" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#stopped" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Speed Recalibration</Header>
                    <Header variant="h2">Stopped speed</Header>
                    <Box variant="p">
                      With the vehicle's wheels free to spin, increase or decrease the Stopped value
                      below until the wheels stop spinning.
                    </Box>
                    <Box variant="p">Stopped value = {stoppedValue}</Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleStoppedSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleStoppedSliderChange}
                        value={stoppedValue}
                        max={30}
                        min={-30}
                        referenceValues={[-20, -10, 0, 10, 20]}
                      />
                      <Button onClick={handleStoppedSliderRight}>{">"}</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_stopped.svg" alt="Calibrate Stopped Speed" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#direction" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Speed Recalibration</Header>
                    <Header variant="h2">Set forward direction</Header>
                    <Box variant="p">
                      Point the vehicle's front to the right as shown in the diagram. Push the left
                      or right arrow to make the wheels turn. The vehicle will drive forward if the
                      wheels turns clock-wise.
                    </Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleDirectionSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleDirectionSliderChange}
                        value={forwardDirectionSpeed}
                        max={50}
                        min={0}
                        referenceValues={[10, 20, 30, 40]}
                      />
                      <Button onClick={handleDirectionSliderRight}>{">"}</Button>
                    </SpaceBetween>
                    <Alert statusIconAriaLabel="Warning" type="warning">
                      <SpaceBetween direction="vertical" size="xs">
                        <Box variant="p">
                          If the wheels turn counter clock-wise, toggle on Reverse direction.
                        </Box>
                        <Toggle onChange={handleToggleChange} checked={checked}>
                          Reverse direction
                        </Toggle>
                      </SpaceBetween>
                    </Alert>
                    <p />
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_forward.svg" alt="Set Forward Direction" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#forward" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Speed Recalibration</Header>
                    <Header variant="h2">Maximum forward speed</Header>
                    <Box variant="p">
                      Move the slider to set the maximum forward speed on the vehicle so that the
                      Estimated speed value matches, precisely or approximately, the value specified
                      in training the model that is or will be loaded to the vehicle's inference
                      engine.
                    </Box>
                    <Box variant="p">
                      Maximum forward speed value ={" "}
                      {forwardValue > getAdjustedRange(50)
                        ? getAdjustedRange(50)
                        : forwardValue < getAdjustedRange(0)
                        ? getAdjustedRange(0)
                        : forwardValue}
                    </Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleForwardSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleForwardSliderChange}
                        value={
                          forwardValue > getAdjustedRange(50)
                            ? getAdjustedRange(50)
                            : forwardValue < getAdjustedRange(0)
                            ? getAdjustedRange(0)
                            : forwardValue
                        }
                        max={getAdjustedRange(50)}
                        min={getAdjustedRange(0)}
                        referenceValues={getReferenceValues(
                          getAdjustedRange(0),
                          getAdjustedRange(50)
                        )}
                      />
                      <Button onClick={handleForwardSliderRight}>{">"}</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_max_forward.svg" alt="Calibrate Forward Speed" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#backward" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Speed Recalibration</Header>
                    <Header variant="h2">Maximum backward speed</Header>
                    <Box variant="p">
                      Move the slider to set the maximum backward speed on the vehicle so that the
                      Estimated speed value matches, precisely or approximately, the value specified
                      in training the model that is or will be loaded to the vehicle's inference
                      engine.
                    </Box>
                    <Box variant="p">
                      Maximum backward speed value ={" "}
                      {backwardValue > getAdjustedRange(0)
                        ? getAdjustedRange(0)
                        : backwardValue < getAdjustedRange(-50)
                        ? getAdjustedRange(-50)
                        : backwardValue}
                    </Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleBackwardSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleBackwardSliderChange}
                        value={
                          backwardValue > getAdjustedRange(0)
                            ? getAdjustedRange(0)
                            : backwardValue < getAdjustedRange(-50)
                            ? getAdjustedRange(-50)
                            : backwardValue
                        }
                        max={getAdjustedRange(0)}
                        min={getAdjustedRange(-50)}
                        referenceValues={getReferenceValues(
                          getAdjustedRange(-50),
                          getAdjustedRange(0)
                        )}
                      />
                      <Button onClick={handleBackwardSliderRight}>{">"}</Button>
                    </SpaceBetween>
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_max_backward.svg" alt="Calibrate Backward Speed" />
                </div>
              </Grid>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleCancel}>Cancel</Button>
              {activeAnchor !== "#raise" && (
                <Button onClick={() => handleNavigation("previous")}>Previous</Button>
              )}
              {activeAnchor !== "#backward" && (
                <Button variant="primary" onClick={() => handleNavigation("next")}>
                  Next
                </Button>
              )}
              {activeAnchor === "#backward" && (
                <Button variant="primary" onClick={handleDone}>
                  Done
                </Button>
              )}
            </SpaceBetween>
          </Container>
        </Grid>
      }
    />
  );
}
