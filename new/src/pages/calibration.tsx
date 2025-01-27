import { TextContent } from "@cloudscape-design/components";
import BaseAppLayout from "../components/base-app-layout";
import * as React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";

const SteeringContainer = () => {
  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button>Calibrate</Button>
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
            { label: "Center", value: "Value" },
            { label: "Maximum left steering angle", value: "Value" },
            { label: "Maximum right steering angle", value: "Value" }
          ]}
        />
    </Container>
  );
}

const SpeedContainer = () => {
  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween
              direction="horizontal"
              size="xs"
            >
              <Button>Calibrate</Button>
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
            { label: "Stopped", value: "Value" },
            { label: "Maximum forward speed", value: "Value" },
            { label: "Maximum backward speed", value: "Value" }
          ]}
        />
    </Container>
  );
}

export default function CalibrationPage() {
  return (
    <BaseAppLayout
      content={
        <TextContent>
          <h1>Calibration</h1>
          <p>Calibrate your vehicle to improve its accuracy, reliability and driving behaviors using the <a href="https://docs.aws.amazon.com/deepracer/latest/developerguide/deepracer-calibrate-vehicle.html?icmpid=docs_deepracer_console" target="_blank">Calibration Guide</a></p>
          <SteeringContainer />
          <SpeedContainer />
        </TextContent>
      }
    />
  );
}
