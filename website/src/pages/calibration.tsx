import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Header,
  KeyValuePairs,
  SpaceBetween,
} from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import { ApiHelper } from "../common/helpers/api-helper";

interface CalibrationResponse {
  success: boolean;
  mid: string;
  max: string;
  min: string;
  polarity: string;
}

const handleStop = async () => {
  await ApiHelper.post<{ success: boolean }>("start_stop", { start_stop: "stop" });
};

const setCalibration = async () => {
  await ApiHelper.get<{ success: boolean }>("set_calibration_mode");
};

const getCalibrationAngle = async () => {
  return await ApiHelper.get<CalibrationResponse>("get_calibration/angle");
};

const getCalibrationThrottle = async () => {
  return await ApiHelper.get<CalibrationResponse>("get_calibration/throttle");
};

const SteeringContainer = () => {
  const [calibrationData, setCalibrationData] = useState({
    mid: "Value",
    max: "Value",
    min: "Value",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalibrationData = async () => {
      await setCalibration();
      const data = await getCalibrationAngle();
      if (data?.success) {
        setCalibrationData({ mid: data.mid, max: data.max, min: data.min });
      }
    };
    fetchCalibrationData();
  }, []);

  return (
    <Container
      header={
        <Header
          actions={<Button onClick={() => navigate("/recalibrate-steering")}>Calibrate</Button>}
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
          { label: "Maximum right steering angle", value: calibrationData.min },
        ]}
      />
    </Container>
  );
};

const SpeedContainer = () => {
  const [calibrationData, setCalibrationData] = useState({
    mid: "Value",
    max: "Value",
    min: "Value",
    polarity: "Value",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCalibrationData = async () => {
      const data = await getCalibrationThrottle();
      if (data?.success) {
        setCalibrationData({
          mid: data.mid,
          max: data.max,
          min: data.min,
          polarity: data.polarity,
        });
      }
    };
    fetchCalibrationData();
  }, []);

  return (
    <Container
      header={
        <Header actions={<Button onClick={() => navigate("/recalibrate-speed")}>Calibrate</Button>}>
          Speed
        </Header>
      }
    >
      <KeyValuePairs
        columns={3}
        items={[
          { label: "Stopped", value: calibrationData.mid },
          {
            label: "Maximum forward speed",
            value: calibrationData.polarity === "-1" ? calibrationData.min : calibrationData.max,
          },
          {
            label: "Maximum backward speed",
            value: calibrationData.polarity === "-1" ? calibrationData.max : calibrationData.min,
          },
        ]}
      />
    </Container>
  );
};

export default function CalibrationPage() {
  useEffect(() => {
    handleStop();

    // Clean up calibration mode when unmounting
    return () => {
      handleStop();
    };
  }, []);

  const description = (
    <>
      Calibrate your vehicle to improve its accuracy, reliability and driving behaviors using the{" "}
      <a
        href="https://docs.aws.amazon.com/deepracer/latest/developerguide/deepracer-calibrate-vehicle.html?icmpid=docs_deepracer_console"
        target="_blank"
        rel="noopener noreferrer"
      >
        Calibration Guide
      </a>
    </>
  );

  return (
    <BaseAppLayout
      content={
        <SpaceBetween size="l">
          <Header variant="h1" description={description}>
            Calibration
          </Header>
          <SteeringContainer />
          <SpeedContainer />
        </SpaceBetween>
      }
    />
  );
}
