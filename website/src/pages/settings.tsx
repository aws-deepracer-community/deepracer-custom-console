import { useSupportedApis } from "../common/hooks/use-supported-apis";
import BaseAppLayout from "../components/base-app-layout";
import { TextContent, Header, SpaceBetween } from "@cloudscape-design/components";
import {
  NetworkSettingsContainer,
  DeviceConsolePasswordContainer,
  DeviceSshContainer,
  TimeContainer,
  LedColorContainer,
  AboutContainer,
} from "../components/settings";

export default function SettingsPage() {
  // Get API support information
  const { isTimeApiSupported } = useSupportedApis();

  return (
    <BaseAppLayout
      content={
        <SpaceBetween size="l">
          <TextContent>
            <Header variant="h1">Settings</Header>
            <p>Adjust your DeepRacer car settings</p>
          </TextContent>
          <NetworkSettingsContainer />
          <DeviceConsolePasswordContainer />
          <DeviceSshContainer />
          {isTimeApiSupported && <TimeContainer />}
          <LedColorContainer />
          <AboutContainer />
        </SpaceBetween>
      }
    />
  );
}
