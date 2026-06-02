import { useSupportedApis } from "../common/hooks/use-supported-apis";
import BaseAppLayout from "../components/base-app-layout";
import { TextContent, Header, SpaceBetween, Tabs } from "@cloudscape-design/components";
import {
  NetworkSettingsContainer,
  DeviceConsolePasswordContainer,
  DeviceSshContainer,
  TimeContainer,
  LedColorContainer,
  AboutContainer,
  CarConfigContainer,
} from "../components/settings";

export default function SettingsPage() {
  const { isTimeApiSupported, isCarConfigSupported } = useSupportedApis();

  return (
    <BaseAppLayout
      content={
        <SpaceBetween size="l">
          <TextContent>
            <Header variant="h1">Settings</Header>
            <p>Adjust your DeepRacer car settings</p>
          </TextContent>
          <AboutContainer />
          <Tabs
            tabs={[
              {
                label: "System Settings",
                id: "system",
                content: (
                  <SpaceBetween size="l">
                    <NetworkSettingsContainer />
                    <DeviceConsolePasswordContainer />
                    <DeviceSshContainer />
                    {isTimeApiSupported && <TimeContainer />}
                  </SpaceBetween>
                ),
              },
              {
                label: "Car Settings",
                id: "car-config",
                content: (
                  <SpaceBetween size="l">
                    <LedColorContainer />
                    {isCarConfigSupported && <CarConfigContainer />}
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </SpaceBetween>
      }
    />
  );
}
