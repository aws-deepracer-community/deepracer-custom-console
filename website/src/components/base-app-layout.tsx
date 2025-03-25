import { AppLayout, AppLayoutProps, Flashbar, FlashbarProps } from "@cloudscape-design/components";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import NavigationPanel from "./navigation-panel";

interface BaseAppLayoutProps extends AppLayoutProps {
  pageNotifications?: FlashbarProps.MessageDefinition[];
}

export default function BaseAppLayout(props: BaseAppLayoutProps) {
  const { pageNotifications: pageNotifications, ...restProps } = props;
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [batteryError, setBatteryError] = useState<boolean>(false);
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);
  const [batteryErrorDismissed, setBatteryErrorDismissed] = useState(false);
  const [hasInitialReading, setHasInitialReading] = useState(false);
  const [pageLoadTime] = useState<number>(Date.now());
  const hasBeenTenSeconds = Date.now() - pageLoadTime >= 10000;

  useEffect(() => {
    const updateBatteryStatus = async () => {
      const batteryData = await getBatteryStatus();
      console.debug("Updating battery status", batteryData);
      if (batteryData && batteryData.success) {
        setHasInitialReading(true);
        if (batteryData.battery_level === -1) {
          setBatteryError(true);
          setBatteryLevel(0);
          setBatteryWarningDismissed(false);
          setBatteryErrorDismissed(false);
        } else {
          setBatteryError(false);
          setBatteryLevel((batteryData.battery_level / 10) * 100);
          setBatteryErrorDismissed(false);
          if (batteryData.battery_level <= 4) {
            setBatteryWarningDismissed(false);
          }
        }
      } else {
        setBatteryError(true);
        setBatteryLevel(0);
        setBatteryWarningDismissed(false);
        setBatteryErrorDismissed(false);
      }
    };

    const getBatteryStatus = async () => {
      try {
        const response = await axios.get("/api/get_battery_level");
        return response.data;
      } catch (error) {
        console.error("Error fetching battery status:", error);
        return null;
      }
    };
    updateBatteryStatus();
    const interval = setInterval(updateBatteryStatus, 10000);
    return () => clearInterval(interval);
  }, []);

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
