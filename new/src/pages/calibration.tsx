import { useEffect, useState } from 'react';
import { TextContent } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

const SteeringContainer = () => {
  const [calibrationData, setCalibrationData] = useState({ mid: 'Value', max: 'Value', min: 'Value' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalibrationData = async () => {
      await setCalibration();
      await handleStop();
      const data = await getCalibrationAngle();
      if (data && data.success) {
        setCalibrationData({ mid: data.mid, max: data.max, min: data.min });
      }
    };
    fetchCalibrationData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button onClick={() => navigate('/recalibrate-steering')}>Calibrate</Button>
            </SpaceBetween>
          }
        >
          Steering
        </Header>
      }
    >
        <KeyValuePairs
          columns={3}
          items={[
            { label: "Center", value: calibrationData.mid },
            { label: "Maximum left steering angle", value: calibrationData.max },
            { label: "Maximum right steering angle", value: calibrationData.min }
          ]}
        />
    </Container>
  );
}

const SpeedContainer = () => {
  const [calibrationData, setCalibrationData] = useState({ mid: 'Value', max: 'Value', min: 'Value', polarity: 'Value' });
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCalibrationData = async () => {
      await setCalibration();
      await handleStop();
      const data = await getCalibrationThrottle();
      if (data && data.success) {
        setCalibrationData({ mid: data.mid, max: data.max, min: data.min, polarity: data.polarity });
      }
    };
    fetchCalibrationData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button onClick={() => navigate('/recalibrate-speed')}>Calibrate</Button>
            </SpaceBetween>
          }
        >
          Speed
        </Header>
      }
    >
        <KeyValuePairs
          columns={3}
          items={[
            { label: "Stopped", value: calibrationData.mid },
            { label: "Maximum forward speed", value: calibrationData.polarity == '-1' ? calibrationData.min : calibrationData.max },
            { label: "Maximum backward speed", value: calibrationData.polarity == '-1' ? calibrationData.max : calibrationData.min }
          ]}
        />
    </Container>
  );
}

export default function CalibrationPage() {
  useEffect(() => {
    setCalibration();
    handleStop();
  }, []);

  return (
    <BaseAppLayout
      content={
        <TextContent>
          <SpaceBetween size="l">
            <h1>Calibration</h1>
            <p>Calibrate your vehicle to improve its accuracy, reliability and driving behaviors using the <a href="https://docs.aws.amazon.com/deepracer/latest/developerguide/deepracer-calibrate-vehicle.html?icmpid=docs_deepracer_console" target="_blank" rel="noopener noreferrer">Calibration Guide</a></p>
            <SteeringContainer />
            <SpeedContainer />
          </SpaceBetween>
        </TextContent>
      }
    />
  );
}
