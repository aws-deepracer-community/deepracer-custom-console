import { useEffect, useState } from 'react';
import { TextContent } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import axios from 'axios';

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

export default function RecalibrateSpeedPage() {
  useEffect(() => {
    setCalibration();
    handleStop();
  }, []);

  return (
    <BaseAppLayout
      content={
        <TextContent>
            <h1>Vehicle Speed Recalibration</h1>
        </TextContent>
      }
    />
  );
}
