import { useEffect, useState, useRef } from 'react';
import { TextContent, Container, Grid, ColumnLayout, Button, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Slider from "@cloudscape-design/components/slider";
import { useNavigate } from 'react-router-dom';
import Alert from "@cloudscape-design/components/alert";
import Toggle from "@cloudscape-design/components/toggle";

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

const setCalibrationThrottle = async (stopped: number, forward: number, backward: number) => {
  try {
    const response = await axios.put('/api/set_calibration/throttle', { stopped, forward, backward });
    console.log('Set calibration throttle:', response.data);
  } catch (error) {
    console.error('Error setting calibration throttle:', error);
  }
};

export default function RecalibrateSpeedPage() {
  const [activeAnchor, setActiveAnchor] = useState('#raise');
  const [stoppedValue, setStoppedValue] = useState(0);
  const [forwardValue, setForwardValue] = useState(0);
  const [backwardValue, setBackwardValue] = useState(0);
  const navigate = useNavigate();

  const [originalStopped, setOriginalStopped] = useState(0);
  const [originalForward, setOriginalForward] = useState(0);
  const [originalBackward, setOriginalBackward] = useState(0);

  const lastUpdateTime = useRef<number>(0);

  const handleStoppedSliderChange = ({ detail }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setStoppedValue(detail.value);
  };

  const handleDirectionSliderChange = ({ detail }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;
  };

  const handleForwardSliderChange = ({ detail }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setForwardValue(detail.value);
  };

  const handleBackwardSliderChange = ({ detail }) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < 200) return;
    lastUpdateTime.current = now;

    setBackwardValue(detail.value);
  };

  useEffect(() => {
    const fetchCalibrationValues = async () => {
      const calibrationData = await getCalibrationThrottle();
      if (calibrationData) {
        setStoppedValue(calibrationData.stopped);
        setForwardValue(calibrationData.forward);
        setBackwardValue(calibrationData.backward);
        setOriginalStopped(calibrationData.stopped);
        setOriginalForward(calibrationData.forward);
        setOriginalBackward(calibrationData.backward);
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
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

  const handleNavigation = (direction) => {
    const currentIndex = anchors.findIndex(anchor => anchor.href === activeAnchor);
    if (direction === 'next' && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === 'previous' && currentIndex > 0) {
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const handleCancel = () => {
    navigate('/calibration');
  };

  const handleDone = async () => {
    await setCalibration();
    await setCalibrationThrottle(stoppedValue, forwardValue, backwardValue);
    navigate('/calibration');
  };

  const [checked, setChecked] = useState(false);
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
                    <h2>Raise your vehicle</h2>
                    <p>Ensure your vehicle is raised off the ground to prevent it from moving during calibration.</p>
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
                  <h2>Calibrate stopped speed</h2>
                  <p>Adjust the stopped speed value to ensure your vehicle remains stationary when no throttle is applied.</p>
                  <p>Stopped speed value = {stoppedValue}</p>
                  <Slider
                    onChange={handleStoppedSliderChange}
                    value={stoppedValue}
                    max={30}
                    min={-30}
                    referenceValues={[-20, -10, 0, 10, 20]}
                  />
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
                  <p>Ensure the vehicle moves forward when the forward throttle is applied.</p>
                  <Slider
                    onChange={handleStoppedSliderChange}
                    value={stoppedValue}
                    max={50}
                    min={0}
                    referenceValues={[10, 20, 30, 40]}
                  />
                                    <Alert
                    statusIconAriaLabel="Warning"
                    type="warning"
                  >
                    If the wheels turn counter clock-wise, toggle on Reverse direction.
                    <Toggle
                      onChange={({ detail }) =>
                        setChecked(detail.checked)
                      }
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
                  <h2>Calibrate maximum forward speed</h2>
                  <p>Adjust the maximum forward speed value to set the top speed of your vehicle when moving forward.</p>
                  <p>Maximum forward speed value = {forwardValue}</p>
                  <Slider
                    onChange={handleForwardSliderChange}
                    value={forwardValue}
                    max={50}
                    min={0}
                    referenceValues={[10, 20, 30, 40]}
                  />
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
                  <h2>Calibrate maximum backward speed</h2>
                  <p>Adjust the maximum backward speed value to set the top speed of your vehicle when moving backward.</p>
                  <p>Maximum backward speed value = {backwardValue}</p>
                  <Slider
                    onChange={handleBackwardSliderChange}
                    value={backwardValue}
                    max={0}
                    min={-50}
                    referenceValues={[-40, -30, -20, -10]}
                  />
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
