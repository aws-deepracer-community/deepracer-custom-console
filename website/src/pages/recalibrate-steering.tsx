import { useEffect, useState, useRef } from 'react';
import { TextContent, Container, Grid, ColumnLayout, Button, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Alert from "@cloudscape-design/components/alert";
import { useNavigate } from 'react-router-dom';
import Slider from "@cloudscape-design/components/slider";

const handleStop = async () => {
  try {
    const response = await axios.post('/api/start_stop', { start_stop: 'stop' });
    console.log('Vehicle stopped:', response.data);
  } catch (error) {
    console.error('Error stopping vehicle:', error);
  }
};

const setSteeringAngle = async (angle: number) => {
  try {
    const response = await axios.put('api/adjust_calibrating_wheels/angle', { pwm: angle });
    console.log('Vehicle stopped:', response.data);
  } catch (error) {
    console.error('Error stopping vehicle:', error);
  }
};

const setCalibration = async () => {
  try {
    const response = await axios.get('/api/set_calibration_mode');
    console.log('Set calibration:', response.data);
  } catch (error) {
    console.error('Error setting calibration mode:', error);
  }
};

const getCalibrationAngle = async () => {
  try {
    const response = await axios.get('/api/get_calibration/angle');
    return response.data;
  } catch (error) {
    console.error('Error fetching calibration angle:', error);
    return null;
  }
};

const setCalibrationAngle = async (center: number, left: number, right: number, polar: number) => {
  try {
    const response = await axios.post('/api/set_calibration/angle', { 
      mid: center, 
      min: left, 
      max: right, 
      polarity: polar 
    });
    console.log('Set calibration angle:', response.data);
  } catch (error) {
    console.error('Error setting calibration angle:', error);
  }
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
        setCenterValue(calibrationData.mid);
        setLeftValue(calibrationData.max);
        setRightValue(calibrationData.min);
        setPolarity(calibrationData.polarity);
        setOriginalCenter(calibrationData.mid);
        setOriginalLeft(calibrationData.max);
        setOriginalRight(calibrationData.min);
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
