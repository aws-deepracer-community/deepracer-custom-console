import { useEffect, useState, useRef } from 'react';
import { TextContent, Container, Grid, ColumnLayout, Button, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Alert from "@cloudscape-design/components/alert";
import { useNavigate } from 'react-router-dom';
import Slider from "@cloudscape-design/components/slider";
import { ApiHelper } from '../common/helpers/api-helper';

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
  await ApiHelper.post<CalibrationResponse>('start_stop', { start_stop: 'stop' });
};

const setSteeringAngle = async (angle: number) => {
  await ApiHelper.post<AdjustWheelsResponse>('adjust_calibrating_wheels/angle', { 
    pwm: angle 
  });
};

const setCalibration = async () => {
  await ApiHelper.get<CalibrationResponse>('set_calibration_mode');
};

const getCalibrationAngle = async () => {
  return await ApiHelper.get<CalibrationResponse>('get_calibration/angle');
};

const setCalibrationAngle = async (center: number, left: number, right: number, polar: number) => {
  return await ApiHelper.post<CalibrationResponse>('set_calibration/angle', { 
    mid: center, 
    min: left, 
    max: right, 
    polarity: polar 
  });
};

export default function RecalibrateSteeringPage() {
  const [activeAnchor, setActiveAnchor] = useState('#ground');
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
    setCenterValue(prev => {
      const newValue = Math.max(prev - 1, -30);
      setSteeringAngle(newValue);
      return newValue;
    });
  };

  const handleCenterSliderRight = () => {
    setCenterValue(prev => {
      const newValue = Math.min(prev + 1, 30);
      setSteeringAngle(newValue);
      return newValue;
    });
  };

  const handleLeftSliderLeft = () => {
    setLeftValue(prev => {
      const newValue = Math.max(prev - 1, -50);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleLeftSliderRight = () => {
    setLeftValue(prev => {
      const newValue = Math.min(prev + 1, 10);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleRightSliderLeft = () => {
    setRightValue(prev => {
      const newValue = Math.max(prev - 1, -10);
      const invertedValue = newValue > 0 ? -newValue : Math.abs(newValue);
      setSteeringAngle(invertedValue);
      return newValue;
    });
  };

  const handleRightSliderRight = () => {
    setRightValue(prev => {
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

    setCalibration();
    handleStop();
    fetchCalibrationValues();
    window.location.hash = '#ground';
    setActiveAnchor('#ground');
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAnchor(window.location.hash);
      if (window.location.hash === '#center') {
        setSteeringAngle(centerValue);
      } else if (window.location.hash === '#left') {
        setLeftValue(prev => -Math.abs(prev));
        setSteeringAngle(leftValue);
      } else if (window.location.hash === '#right') {
        setRightValue(prev => Math.abs(prev));
        setSteeringAngle(rightValue);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [centerValue, leftValue, rightValue]);

  const anchors = [
    {
      text: "Set your vehicle on the ground",
      href: "#ground",
      level: 1
    },
    {
      text: "Calibrate center",
      href: "#center",
      level: 1
    },
    {
      text: "Calibrate maximum left steering",
      href: "#left",
      level: 1
    },
    { 
      text: "Calibrate maximum right steering",
      href: "#right",
      level: 1
    }
  ];

  const handleNavigation = (direction: string) => {
    const currentIndex = anchors.findIndex(anchor => anchor.href === activeAnchor);
    if (direction === 'next' && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === 'previous' && currentIndex > 0) {
      if (activeAnchor === '#left') {
        setSteeringAngle(originalLeft);
      } else if (activeAnchor === '#right') {
        setSteeringAngle(originalRight);
      }
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const handleCancel = () => {
    if (activeAnchor === '#center') {
      setSteeringAngle(originalCenter);
    } else if (activeAnchor === '#left') {
      setSteeringAngle(originalCenter);
      setSteeringAngle(originalLeft);
    } else if (activeAnchor === '#right') {
      setSteeringAngle(originalCenter);
      setSteeringAngle(originalLeft);
      setSteeringAngle(originalRight);
    }
    navigate('/calibration');
  };

  const handleDone = async () => {
    await setCalibration();
    await setCalibrationAngle(centerValue, leftValue, rightValue, polarity);
    setSteeringAngle(centerValue);
    //add a delay to allow the calibration to be set before navigating
    setTimeout(() => {
      navigate('/calibration');
    }, 1000);
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
              anchors={anchors.map(anchor => ({
                ...anchor,
                className: anchor.href === activeAnchor ? '' : 'greyed-out'
              }))}
            />
          </div>
          <Container>
            {activeAnchor === '#ground' && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <TextContent>
                    <h1>Vehicle Steering Recalibration</h1>
                    <h2>Set vehicle on the ground</h2>
                    <p>Place your vehicle on the ground or other hard surface within eyesight. You must be able to see the wheels during steering calibration.</p>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_ground.svg" alt="Calibrate Ground" />
                </div>
              </ColumnLayout>
            )}
            {activeAnchor === '#center' && (
              <ColumnLayout columns={2} variant="text-grid">
              <div>
                <TextContent>
                  <h1>Vehicle Steering Recalibration</h1>
                  <h2>Center steering</h2>
                  <p>Increase or decrease the Center value to center your vehicle. It is centered when any of the wheels points forward. Use a ruler or straight edge to ensure it is aligned with the rear wheel.</p>
                  <p>Center value = {centerValue}</p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={handleCenterSliderLeft}>{'<'}</Button>
                    <Slider
                      onChange={handleCenterSliderChange}
                      value={centerValue}
                      max={30}
                      min={-30}
                      referenceValues={[-20, -10, 0, 10, 20]}
                    />
                    <Button onClick={handleCenterSliderRight}>{'>'}</Button>
                  </div>
                  <Alert
                    statusIconAriaLabel="Info"
                  >
                    The front wheels may not be perfectly aligned to each other -- it is important for one front wheel to be facing forward. DeepRacer uses Ackermann steering.
                  </Alert>
                  <p></p>
                </TextContent>
              </div>
              <div>
                <img src="static/calibrate_center.svg" alt="Calibrate Ground" />
              </div>
            </ColumnLayout>
            )}
            {activeAnchor === '#left' && (
              <ColumnLayout columns={2} variant="text-grid">
              <div>
                <TextContent>
                  <h1>Vehicle Steering Recalibration</h1>
                  <h2>Maximum left steering</h2>
                  <p>Increase the Value to turn the front wheels to the left until they stop turning.</p>
                  <p>Value = {leftValue > 0 ? -leftValue : Math.abs(leftValue)}</p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={handleLeftSliderLeft}>{'<'}</Button>
                    <Slider
                      onChange={handleLeftSliderChange}
                      value={leftValue}
                      valueFormatter={valueFormatter}
                      max={10}
                      min={-50}
                      referenceValues={[-40, -30, -20, -10, 0]}
                    />
                    <Button onClick={handleLeftSliderRight}>{'>'}</Button>
                  </div>
                  <p>Estimated angle: 26-32 degrees</p>
                </TextContent>
              </div>
              <div>
                <img src="static/calibrate_left.svg" alt="Calibrate Ground" />
              </div>
            </ColumnLayout>
            )}
            {activeAnchor === '#right' && (
              <ColumnLayout columns={2} variant="text-grid">
              <div>
                <TextContent>
                  <h1>Vehicle Steering Recalibration</h1>
                  <h2>Maximum right steering</h2>
                  <p>Increase the Value to turn the front wheels to the right until they stop turning.</p>
                  <p>Value = {rightValue > 0 ? -rightValue : Math.abs(rightValue)}</p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={handleRightSliderLeft}>{'<'}</Button>
                    <Slider
                      onChange={handleRightSliderChange}
                      value={rightValue}
                      valueFormatter={valueFormatter}
                      max={50}
                      min={-10}
                      referenceValues={[0, 10, 20, 30, 40]}
                    />
                    <Button onClick={handleRightSliderRight}>{'>'}</Button>
                  </div>
                  <p>Estimated angle: 26-32 degrees</p>
                </TextContent>
              </div>
              <div>
                <img src="static/calibrate_right.svg" alt="Calibrate Ground" />
              </div>
            </ColumnLayout>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleCancel}>Cancel</Button>
              {activeAnchor !== '#ground' && (
                <Button onClick={() => handleNavigation('previous')}>Previous</Button>
              )}
              {activeAnchor !== '#right' && (
                <Button variant="primary" onClick={() => handleNavigation('next')}>Next</Button>
              )}
              {activeAnchor === '#right' && (
                <Button variant="primary" onClick={handleDone}>Done</Button>
              )}
            </SpaceBetween>
          </Container>
        </Grid>
      }
    />
  );
}
