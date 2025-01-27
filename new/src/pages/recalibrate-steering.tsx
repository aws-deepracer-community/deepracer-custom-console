import { useEffect, useState } from 'react';
import { TextContent, Container, Grid } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";

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

const getCalibrationThrottle = async () => {
  try {
    const response = await axios.get('/api/get_calibration/throttle');
    return response.data;
  } catch (error) {
    console.error('Error fetching calibration throttle:', error);
    return null;
  }
};

export default function RecalibrateSteeringPage() {
  useEffect(() => {
    setCalibration();
    handleStop();
    window.location.hash = '#ground';
  }, []);

  return (
    <BaseAppLayout
      content={
        <Grid gridDefinition={[{ colspan: 3 }, { colspan: 9 }]}>
          <div>
            <AnchorNavigation
              anchors={[
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
              ]}
            />
          </div>
          <Container>
            <TextContent>
              <h1>Vehicle Steering Recalibration</h1>
              <h2>Set vehicle on the ground</h2>
            </TextContent>
          </Container>
        </Grid>
      }
    />
  );
}
