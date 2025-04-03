import { AppLayout, AppLayoutProps, Flashbar, FlashbarProps } from "@cloudscape-design/components";
import { useState } from "react";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import NavigationPanel from "./navigation-panel";
import { useBattery } from "../common/hooks/use-battery";

interface BaseAppLayoutProps extends AppLayoutProps {
  pageNotifications?: FlashbarProps.MessageDefinition[];
}

export default function BaseAppLayout(props: BaseAppLayoutProps) {
  const { pageNotifications, ...restProps } = props;
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [pageLoadTime] = useState<number>(Date.now());
  const hasBeenTenSeconds = Date.now() - pageLoadTime >= 10000;
  
  // Use the battery context instead of local state
  const {
    batteryLevel,
    batteryError,
    hasInitialReading,
    batteryWarningDismissed,
    batteryErrorDismissed,
    setBatteryWarningDismissed,
    setBatteryErrorDismissed
  } = useBattery();

  return (
    <AppLayout
      headerSelector="#awsui-top-navigation"
      navigation={<NavigationPanel battery={{ level: batteryLevel, error: batteryError, hasInitialReading: hasInitialReading }} />}
      navigationOpen={!navigationPanelState.collapsed}
      onNavigationChange={({ detail }) => setNavigationPanelState({ collapsed: !detail.open })}
      toolsHide={true}
      notifications={
        <Flashbar
          items={[
            ...((batteryError || (!hasInitialReading && hasBeenTenSeconds)) &&
            !batteryErrorDismissed
              ? [
                  {
                    type: "error" as FlashbarProps.Type,
                    content:
                      !hasInitialReading && hasBeenTenSeconds
                        ? "Unable to get battery reading"
                        : "Vehicle battery is not connected",
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    id: "battery-error",
                    onDismiss: () => setBatteryErrorDismissed(true),
                  },
                ]
              : []),
            ...(batteryLevel <= 40 && !batteryError && !batteryWarningDismissed && hasInitialReading
              ? [
                  {
                    type: "warning" as FlashbarProps.Type,
                    content: `Battery Level is at ${batteryLevel}%`,
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    id: "battery-warning",
                    onDismiss: () => setBatteryWarningDismissed(true),
                  },
                ]
              : []),
            ...(pageNotifications || []),
          ]}
        />
      }
      {...restProps}
    />
  );
}
