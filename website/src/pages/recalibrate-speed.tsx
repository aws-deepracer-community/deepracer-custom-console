import { useEffect, useState, useRef } from 'react';
import { TextContent, Container, Grid, ColumnLayout, Button, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Slider from "@cloudscape-design/components/slider";
import { useNavigate } from 'react-router-dom';
import Alert from "@cloudscape-design/components/alert";
import Toggle from "@cloudscape-design/components/toggle";

const handleStop = async () => {
  try {
    const response = await axios.post('/api/start_stop', { start_stop: 'stop' });
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

const getCalibrationThrottle = async () => {
  try {
    const response = await axios.get('/api/get_calibration/throttle');
    return response.data;
  } catch (error) {
    console.error('Error fetching calibration throttle:', error);
    return null;
  }
};

const setCalibrationThrottle = async (stopped: number, forward: number, backward: number, polar: number) => {
  try {
    const response = await axios.post('/api/set_calibration/throttle', { 
      mid: stopped, 
      min: polar == 1 ? backward : -forward, 
      max: polar == 1 ? forward : -backward,  
      polarity: polar 
    });
    console.log('Set calibration throttle:', response.data);
  } catch (error) {
    console.error('Error setting calibration throttle:', error);
  }
};

const adjustCalibratingWheelsThrottle = async (throttleValue: number) => {
  try {
    const response = await axios.post('/api/adjust_calibrating_wheels/throttle', { pwm: throttleValue });
    console.log('Adjusted calibrating wheels throttle:', response.data);
  } catch (error) {
    console.error('Error adjusting calibrating wheels throttle:', error);
  }
};

export default function RecalibrateSpeedPage() {
  const [activeAnchor, setActiveAnchor] = useState('#raise');
  const [stoppedValue, setStoppedValue] = useState(0);
  const [forwardValue, setForwardValue] = useState(0);
  const [backwardValue, setBackwardValue] = useState(0);
  const [polarity, setPolarity] = useState(0);
  const navigate = useNavigate();

  const [originalStopped, setOriginalStopped] = useState(0);

  const lastUpdateTime = useRef<number>(0);

  const [forwardDirectionSpeed, setForwardDirectionSpeed] = useState(20);

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
    setStoppedValue(prev => {
      const newValue = Math.max(prev - 1, -30);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleStoppedSliderRight = () => {
    setStoppedValue(prev => {
      const newValue = Math.min(prev + 1, 30);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleForwardSliderLeft = () => {
    setForwardValue(prev => {
      const newValue = Math.max(prev - 1, getAdjustedRange(0));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleForwardSliderRight = () => {
    setForwardValue(prev => {
      const newValue = Math.min(prev + 1, getAdjustedRange(50));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleBackwardSliderLeft = () => {
    setBackwardValue(prev => {
      const newValue = Math.max(prev - 1, getAdjustedRange(-50));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleBackwardSliderRight = () => {
    setBackwardValue(prev => {
      const newValue = Math.min(prev + 1, getAdjustedRange(0));
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleDirectionSliderLeft = () => {
    setForwardDirectionSpeed(prev => {
      const newValue = Math.max(prev - 1, 0);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  const handleDirectionSliderRight = () => {
    setForwardDirectionSpeed(prev => {
      const newValue = Math.min(prev + 1, 50);
      adjustCalibratingWheelsThrottle(newValue);
      return newValue;
    });
  };

  useEffect(() => {
    const fetchCalibrationValues = async () => {
      const calibrationData = await getCalibrationThrottle();
      if (calibrationData) {
        setStoppedValue(calibrationData.mid);
        setForwardValue(Math.abs(calibrationData.min)); // Show absolute value initially
        setBackwardValue(-Math.abs(calibrationData.max)); // Show negative value initially
        setPolarity(calibrationData.polarity);
        setOriginalStopped(calibrationData.mid);
        setChecked(calibrationData.polarity === -1);
      }
    };

    setCalibration();
    handleStop();
    fetchCalibrationValues();
    window.location.hash = '#raise';
    setActiveAnchor('#raise');
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveAnchor(window.location.hash);
      if (window.location.hash === '#stopped') {
        adjustCalibratingWheelsThrottle(stoppedValue);
      } else if (window.location.hash === '#direction') {
        adjustCalibratingWheelsThrottle(forwardDirectionSpeed);
      } else if (window.location.hash === '#forward') {
        adjustCalibratingWheelsThrottle(forwardValue);
      } else if (window.location.hash === '#backward') {
        adjustCalibratingWheelsThrottle(backwardValue);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [stoppedValue, forwardDirectionSpeed, forwardValue, backwardValue]);

  const anchors = [
    {
      text: "Raise your vehicle",
      href: "#raise",
      level: 1
    },
    {
      text: "Calibrate stopped speed",
      href: "#stopped",
      level: 1
    },
    {
      text: "Set forward direction",
      href: "#direction",
      level: 1
    },
    { 
      text: "Calibrate maximum forward speed",
      href: "#forward",
      level: 1
    },
    { 
      text: "Calibrate maximum backward speed",
      href: "#backward",
      level: 1
    }
  ];

  const handleNavigation = (direction: string) => {
    const currentIndex = anchors.findIndex(anchor => anchor.href === activeAnchor);
    if (direction === 'next' && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === 'previous' && currentIndex > 0) {
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const handleCancel = () => {
    handleStop();
    adjustCalibratingWheelsThrottle(originalStopped);
    navigate('/calibration');
  };

  const handleDone = async () => {
    await setCalibration();
    await setCalibrationThrottle(stoppedValue, forwardValue, backwardValue, polarity);
    adjustCalibratingWheelsThrottle(stoppedValue);
    navigate('/calibration');
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
            <AnchorNavigation
              anchors={anchors.map(anchor => ({
                ...anchor,
                className: anchor.href === activeAnchor ? '' : 'greyed-out'
              }))}
            />
          </div>
          <Container>
            {activeAnchor === '#raise' && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <TextContent>
                    <h1>Vehicle Speed Recalibration</h1>
                    <h2>Raise vehicle</h2>
                    <p>Raise your vehicle to keep wheels from touching the ground and to key them moving freely.</p>
                    <Alert
                    statusIconAriaLabel="Warning"
                    type="warning"
                    header="Wheels spin at high speeds"
                  >
                    Raise your vehicle on a stable surface when calibrating speed
                  </Alert>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_raised_ground.svg" alt="Raise Vehicle" />
                </div>
              </ColumnLayout>
            )}
            {activeAnchor === '#stopped' && (
              <ColumnLayout columns={2} variant="text-grid">
              <div>
                <TextContent>
                  <h1>Vehicle Speed Recalibration</h1>
                  <h2>Stopped speed</h2>
                  <p>With the vehicle’s wheels free to spin, increase or decrease the Stopped value below until the wheels stop spinning.</p>
                  <p>Stopped value = {stoppedValue}</p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={handleStoppedSliderLeft}>{'<'}</Button>
                    <Slider
                      onChange={handleStoppedSliderChange}
                      value={stoppedValue}
                      max={30}
                      min={-30}
                      referenceValues={[-20, -10, 0, 10, 20]}
                    />
                    <Button onClick={handleStoppedSliderRight}>{'>'}</Button>
                  </div>
                </TextContent>
              </div>
              <div>
                <img src="static/calibrate_stopped.svg" alt="Calibrate Stopped Speed" />
              </div>
            </ColumnLayout>
            )}
            {activeAnchor === '#direction' && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <TextContent>
                    <h1>Vehicle Speed Recalibration</h1>
                    <h2>Set forward direction</h2>
                    <p>Point the vehicle’s front to the right as shown in the diagram. Push the left or right arrow to make the wheels turn. The vehicle will drive forward if the wheels turns clock-wise.</p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Button onClick={handleDirectionSliderLeft}>{'<'}</Button>
                      <Slider
                        onChange={handleDirectionSliderChange}
                        value={forwardDirectionSpeed}
                        max={50}
                        min={0}
                        referenceValues={[10, 20, 30, 40]}
                      />
                      <Button onClick={handleDirectionSliderRight}>{'>'}</Button>
                    </div>
                    <Alert
                      statusIconAriaLabel="Warning"
                      type="warning"
                    >
                      If the wheels turn counter clock-wise, toggle on Reverse direction.
                      <Toggle
                        onChange={handleToggleChange}
                        checked={checked}
                      >
                        Reverse direction
                      </Toggle>
                    </Alert>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_forward.svg" alt="Set Forward Direction" />
                </div>
              </ColumnLayout>
            )}
            {activeAnchor === '#forward' && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <TextContent>
                    <h1>Vehicle Speed Recalibration</h1>
                    <h2>Maximum forward speed</h2>
                    <p>Move the slider to set the maximum forward speed on the vehicle so that the Estimated speed value matches, precisely or approximately, the value specified in training the model that is or will be loaded to the vehicle’s inference engine.</p>
                    <p>Maximum forward speed value = {forwardValue > getAdjustedRange(50) ? getAdjustedRange(50) : (forwardValue) < getAdjustedRange(0) ? getAdjustedRange(0) : (forwardValue)}</p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Button onClick={handleForwardSliderLeft}>{'<'}</Button>
                      <Slider
                        onChange={handleForwardSliderChange}
                        value={forwardValue > getAdjustedRange(50) ? getAdjustedRange(50) : (forwardValue) < getAdjustedRange(0) ? getAdjustedRange(0) : (forwardValue)}
                        max={getAdjustedRange(50)}
                        min={getAdjustedRange(0)}
                        referenceValues={getReferenceValues(getAdjustedRange(0), getAdjustedRange(50))}
                      />
                      <Button onClick={handleForwardSliderRight}>{'>'}</Button>
                    </div>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_max_forward.svg" alt="Calibrate Forward Speed" />
                </div>
              </ColumnLayout>
            )}
            {activeAnchor === '#backward' && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <TextContent>
                    <h1>Vehicle Speed Recalibration</h1>
                    <h2>Maximum backward speed</h2>
                    <p>Move the slider to set the maximum backward speed on the vehicle so that the Estimated speed value matches, precisely or approximately, the value specified in training the model that is or will be loaded to the vehicle’s inference engine.</p>
                    <p>Maximum backward speed value = {backwardValue > getAdjustedRange(0) ? getAdjustedRange(0) : (backwardValue) < getAdjustedRange(-50) ? getAdjustedRange(-50) : (backwardValue)}</p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Button onClick={handleBackwardSliderLeft}>{'<'}</Button>
                      <Slider
                        onChange={handleBackwardSliderChange}
                        value={backwardValue > getAdjustedRange(0) ? getAdjustedRange(0) : (backwardValue) < getAdjustedRange(-50) ? getAdjustedRange(-50) : (backwardValue)}
                        max={getAdjustedRange(0)}
                        min={getAdjustedRange(-50)}
                        referenceValues={getReferenceValues(getAdjustedRange(-50), getAdjustedRange(0))}
                      />
                      <Button onClick={handleBackwardSliderRight}>{'>'}</Button>
                    </div>
                  </TextContent>
                </div>
                <div>
                  <img src="static/calibrate_max_backward.svg" alt="Calibrate Backward Speed" />
                </div>
              </ColumnLayout>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleCancel}>Cancel</Button>
              {activeAnchor !== '#raise' && (
                <Button onClick={() => handleNavigation('previous')}>Previous</Button>
              )}
              {activeAnchor !== '#backward' && (
                <Button variant="primary" onClick={() => handleNavigation('next')}>Next</Button>
              )}
              {activeAnchor === '#backward' && (
                <Button variant="primary" onClick={handleDone}>Done</Button>
              )}
            </SpaceBetween>
          </Container>
        </Grid>
      }
    />
  );
}