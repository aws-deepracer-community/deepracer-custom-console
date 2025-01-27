import { useEffect, useState } from 'react';
import { TextContent, Container, Grid, ColumnLayout, Button, SpaceBetween } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";
import Alert from "@cloudscape-design/components/alert";
import { useNavigate } from 'react-router-dom';
import Slider from "@cloudscape-design/components/slider";

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

const getCalibrationAngle = async () => {
  try {
    const response = await axios.get('/api/get_calibration/angle');
    return response.data;
  } catch (error) {
    console.error('Error fetching calibration angle:', error);
    return null;
  }
};

export default function RecalibrateSteeringPage() {
  const [activeAnchor, setActiveAnchor] = useState('#ground');
  const navigate = useNavigate();

  useEffect(() => {
    setCalibration();
    handleStop();
    window.location.hash = '#ground';
    setActiveAnchor('#ground');
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

  const handleNavigation = (direction) => {
    const currentIndex = anchors.findIndex(anchor => anchor.href === activeAnchor);
    if (direction === 'next' && currentIndex < anchors.length - 1) {
      window.location.hash = anchors[currentIndex + 1].href;
    } else if (direction === 'previous' && currentIndex > 0) {
      window.location.hash = anchors[currentIndex - 1].href;
    }
  };

  const [centerValue, setCenterValue] = useState(0);
  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(0);

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
                  <p>Center value</p>
                  <Slider
                    onChange={({ detail }) => setCenterValue(detail.value)}
                    value={centerValue}
                    max={30}
                    min={-30}
                    referenceValues={[-20, -10, 0, 10, 20]}
                  />
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
                  <p>Value</p>
                  <Slider
                    onChange={({ detail }) => setLeftValue(detail.value)}
                    value={leftValue}
                    valueFormatter={value => value > 0 ? -value : Math.abs(value)}
                    max={10}
                    min={-50}
                    referenceValues={[-40, -30, -20, -10, 0]}
                  />
                  <p>Estimated angle:</p>
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
                  <p>Value</p>
                  <Slider
                    onChange={({ detail }) => setLeftValue(detail.value)}
                    value={leftValue}
                    valueFormatter={value => value > 0 ? -value : Math.abs(value)}
                    max={50}
                    min={-10}
                    referenceValues={[0, 10, 20, 30, 40]}
                  />
                  <p>Estimated angle:</p>
                </TextContent>
              </div>
              <div>
                <img src="static/calibrate_right.svg" alt="Calibrate Ground" />
              </div>
            </ColumnLayout>
            )}
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate('/calibration')}>Cancel</Button>
              {activeAnchor !== '#ground' && (
                <Button onClick={() => handleNavigation('previous')}>Previous</Button>
              )}
              {activeAnchor !== '#right' && (
                <Button variant="primary" onClick={() => handleNavigation('next')}>Next</Button>
              )}
              {activeAnchor === '#right' && (
                <Button variant="primary" onClick={() => navigate('/calibration')}>Done</Button>
              )}
            </SpaceBetween>
          </Container>
        </Grid>
      }
    />
  );
}
