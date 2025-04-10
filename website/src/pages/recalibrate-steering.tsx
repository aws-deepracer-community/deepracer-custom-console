import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AnchorNavigation,
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Header,
  Slider,
  SpaceBetween,
  TextContent,
} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import { ApiHelper } from "../common/helpers/api-helper";

// Add interfaces for API responses
interface CalibrationResponse {
  success: boolean;
  mid?: string;
  max?: string;
  min?: string;
  polarity?: string;
}

interface AdjustWheelsResponse {
  success: boolean;
}

const handleStop = async () => {
  await ApiHelper.post<CalibrationResponse>("start_stop", { start_stop: "stop" });
};

const setSteeringAngle = async (angle: number) => {
  await ApiHelper.post<AdjustWheelsResponse>("adjust_calibrating_wheels/angle", {
    pwm: angle,
  });
};

const setCalibration = async () => {
  await ApiHelper.get<CalibrationResponse>("set_calibration_mode");
};

const getCalibrationAngle = async () => {
  return await ApiHelper.get<CalibrationResponse>("get_calibration/angle");
};

const setCalibrationAngle = async (center: number, left: number, right: number, polar: number) => {
  return await ApiHelper.post<CalibrationResponse>("set_calibration/angle", {
    mid: center,
    min: left,
    max: right,
    polarity: polar,
  });
};

export default function RecalibrateSteeringPage() {
  const [activeAnchor, setActiveAnchor] = useState("#ground");
  const [centerValue, setCenterValue] = useState(0);
  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);
  const [polarity, setPolarity] = useState(0);
  const navigate = useNavigate();

  const [originalCenter, setOriginalCenter] = useState(0);
  const [originalLeft, setOriginalLeft] = useState(0);
  const [originalRight, setOriginalRight] = useState(0);

  const lastUpdateTime = useRef<number>(0);

  const handleCenterSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 100) return;
    lastUpdateTime.current = now;

    setCenterValue(detail.value);
    setSteeringAngle(detail.value);
  };

  const handleLeftSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 100) return;
    lastUpdateTime.current = now;

    const invertedValue = detail.value > 0 ? -detail.value : Math.abs(detail.value);
    setLeftValue(detail.value);
    setSteeringAngle(invertedValue);
  };

  const handleRightSliderChange = ({ detail }: { detail: { value: number } }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 100) return;
    lastUpdateTime.current = now;

    const invertedValue = detail.value > 0 ? -detail.value : Math.abs(detail.value);
    setRightValue(detail.value);
    setSteeringAngle(invertedValue);
  };

  const handleCenterSliderLeft = () => {
    setCenterValue((prev) => {
      const newValue = Math.max(prev - 1, -30);
      setSteeringAngle(newValue);
      return newValue;
    });
  };

  const handleCenterSliderRight = () => {
    setCenterValue((prev) => {
      const newValue = Math.min(prev + 1, 30);
      setSteeringAngle(newValue);
      return newValue;
    });
  };

  const handleLeftSliderLeft = () => {
    setLeftValue((prev) => {
      const newValue = Math.max(prev - 1, -50);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleLeftSliderRight = () => {
    setLeftValue((prev) => {
      const newValue = Math.min(prev + 1, 10);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleRightSliderLeft = () => {
    setRightValue((prev) => {
      const newValue = Math.max(prev - 1, -10);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleRightSliderRight = () => {
    setRightValue((prev) => {
      const newValue = Math.min(prev + 1, 50);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  useEffect(() => {
    const fetchCalibrationValues = async () => {
      const calibrationData = await getCalibrationAngle();
      if (calibrationData) {
        setCenterValue(calibrationData.mid ? parseInt(calibrationData.mid, 10) : 0);
        setLeftValue(calibrationData.max ? parseInt(calibrationData.max, 10) : 0);
        setRightValue(calibrationData.min ? parseInt(calibrationData.min, 10) : 0);
        setPolarity(calibrationData.polarity ? parseInt(calibrationData.polarity, 10) : 0);
        setOriginalCenter(calibrationData.mid ? parseInt(calibrationData.mid, 10) : 0);
        setOriginalLeft(calibrationData.max ? parseInt(calibrationData.max, 10) : 0);
        setOriginalRight(calibrationData.min ? parseInt(calibrationData.min, 10) : 0);
      }
    };

    handleStop();
    fetchCalibrationValues();
    setCalibration();
    window.location.hash = "#ground";
    setActiveAnchor("#ground");
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAnchor(window.location.hash);
      if (window.location.hash === "#center") {
        setSteeringAngle(centerValue);
      } else if (window.location.hash === "#left") {
        setLeftValue((prev) => -Math.abs(prev));
        setSteeringAngle(leftValue);
      } else if (window.location.hash === "#right") {
        setRightValue((prev) => Math.abs(prev));
        setSteeringAngle(rightValue);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [centerValue, leftValue, rightValue]);

  const anchors = [
    {
      text: "Set your vehicle on the ground",
      href: "#ground",
      level: 1,
    },
    {
      text: "Calibrate center",
      href: "#center",
      level: 1,
    },
    {
      text: "Calibrate maximum left steering",
      href: "#left",
      level: 1,
    },
    {
      text: "Calibrate maximum right steering",
      href: "#right",
      level: 1,
    },
  ];

  const handleNavigation = (direction: string) => {
    const currentIndex = anchors.findIndex((anchor) => anchor.href === activeAnchor);
    if (direction === "next" && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === "previous" && currentIndex > 0) {
      if (activeAnchor === "#left") {
        setSteeringAngle(originalLeft);
      } else if (activeAnchor === "#right") {
        setSteeringAngle(originalRight);
      }
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const handleCancel = async () => {
    await setSteeringAngle(originalCenter);
    await handleStop();
    navigate("/calibration");
  };

  const handleDone = async () => {
    await setSteeringAngle(centerValue);
    await setCalibrationAngle(centerValue, leftValue, rightValue, polarity);
    navigate("/calibration");
  };

  // Fix valueFormatter type error
  const valueFormatter = (value: number): string => {
    return (value > 0 ? -value : Math.abs(value)).toString();
  };

  return (
    <BaseAppLayout
      content={
        <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
          <div>
            <AnchorNavigation
              anchors={anchors.map((anchor) => ({
                ...anchor,
                className: anchor.href === activeAnchor ? "" : "greyed-out",
              }))}
            />
          </div>
          <Container>
            {activeAnchor === "#ground" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <TextContent>
                    <Header variant="h1">Vehicle Steering Recalibration</Header>
                    <Header variant="h2">Set vehicle on the ground</Header>
                    <Box variant="p">
                      Place your vehicle on the ground or other hard surface within eyesight. You
                      must be able to see the wheels during steering calibration.
                    </Box>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_ground.svg" alt="Calibrate Ground" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#center" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="xs">
                    <Header variant="h1">Vehicle Steering Recalibration</Header>
                    <Header variant="h2">Center steering</Header>
                    <Box variant="p">
                      Increase or decrease the Center value to center your vehicle. It is centered
                      when any of the wheels points forward. Use a ruler or straight edge to ensure
                      it is aligned with the rear wheel.
                    </Box>
                    <Box variant="p">Center value = {centerValue}</Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleCenterSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleCenterSliderChange}
                        value={centerValue}
                        max={30}
                        min={-30}
                        referenceValues={[-20, -10, 0, 10, 20]}
                      />
                      <Button onClick={handleCenterSliderRight}>{">"}</Button>
                    </SpaceBetween>
                    <Alert statusIconAriaLabel="Info">
                      The front wheels may not be perfectly aligned to each other -- it is important
                      for one front wheel to be facing forward. DeepRacer uses Ackermann steering.
                    </Alert>
                    <p />
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_center.svg" alt="Calibrate Center" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#left" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <SpaceBetween direction="vertical" size="l">
                    <Header variant="h1">Vehicle Steering Recalibration</Header>
                    <Header variant="h2">Maximum left steering</Header>
                    <Box variant="p">
                      Increase the Value to turn the front wheels to the left until they stop
                      turning.
                    </Box>
                    <Box variant="p">
                      Value = {leftValue > 0 ? -leftValue : Math.abs(leftValue)}
                    </Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleLeftSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleLeftSliderChange}
                        value={leftValue}
                        valueFormatter={valueFormatter}
                        max={10}
                        min={-50}
                        referenceValues={[-40, -30, -20, -10, 0]}
                      />
                      <Button onClick={handleLeftSliderRight}>{">"}</Button>
                    </SpaceBetween>
                    <Box variant="p">Estimated angle: 26-32 degrees</Box>
                  </SpaceBetween>
                </div>
                <div>
                  <img src="static/calibrate_left.svg" alt="Calibrate Left" />
                </div>
              </Grid>
            )}
            {activeAnchor === "#right" && (
              <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
                <div>
                  <TextContent>
                    <Header variant="h1">Vehicle Steering Recalibration</Header>
                    <Header variant="h2">Maximum right steering</Header>
                    <Box variant="p">
                      Increase the Value to turn the front wheels to the right until they stop
                      turning.
                    </Box>
                    <Box variant="p">
                      Value = {rightValue > 0 ? -rightValue : Math.abs(rightValue)}
                    </Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button onClick={handleRightSliderLeft}>{"<"}</Button>
                      <Slider
                        onChange={handleRightSliderChange}
                        value={rightValue}
                        valueFormatter={valueFormatter}
                        max={50}
                        min={-10}
                        referenceValues={[0, 10, 20, 30, 40]}
                      />
                      <Button onClick={handleRightSliderRight}>{">"}</Button>
                    </SpaceBetween>
                    <Box variant="p">Estimated angle: 26-32 degrees</Box>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_right.svg" alt="Calibrate Right" />
                </div>
              </Grid>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleCancel}>Cancel</Button>
              {activeAnchor !== "#ground" && (
                <Button onClick={() => handleNavigation("previous")}>Previous</Button>
              )}
              {activeAnchor !== "#right" && (
                <Button variant="primary" onClick={() => handleNavigation("next")}>
                  Next
                </Button>
              )}
              {activeAnchor === "#right" && (
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
