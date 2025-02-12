import { AppLayout, AppLayoutProps, Flashbar } from "@cloudscape-design/components";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import NavigationPanel from "./navigation-panel";
import { useState, useEffect } from "react";
import axios from 'axios';
import { FlashbarProps } from "@cloudscape-design/components";


export default function BaseAppLayout(props: AppLayoutProps) {
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [batteryError, setBatteryError] = useState<boolean>(false);
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);
  const [batteryErrorDismissed, setBatteryErrorDismissed] = useState(false);

  const updateBatteryStatus = async () => {
    const batteryData = await getBatteryStatus();
    if (batteryData && batteryData.success) {
      if (batteryData.battery_level === -1) {
        setBatteryError(true);
        setBatteryLevel(0);
        setBatteryWarningDismissed(false); // Reset warning dismissed state
        setBatteryErrorDismissed(false);   // Reset error dismissed state
      } else {
        setBatteryError(false);
        setBatteryLevel((batteryData.battery_level / 10) * 100);
        setBatteryErrorDismissed(false);   // Reset error dismissed state
        // Only reset warning dismissed state if battery level drops to 40 or below
        if (batteryData.battery_level <= 4) {
          setBatteryWarningDismissed(false);
        }
      }
    }
  };

  const getBatteryStatus = async () => {
    try {
      const response = await axios.get('/api/get_battery_level');
      return response.data;
    } catch (error) {
      console.error('Error fetching battery status:', error);
      return null;
    }
  };

  useEffect(() => {
    updateBatteryStatus();
    const interval = setInterval(updateBatteryStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
        <Flashbar
          items={[
            ...(batteryError && !batteryErrorDismissed
              ? [
                  {
                    type: "error" as FlashbarProps.Type, // Add type assertion
                    content: "Vehicle battery is not connected",
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    id: "battery-error",
                    onDismiss: () => setBatteryErrorDismissed(true),
                  },
                ]
              : []),
            ...(batteryLevel <= 40 && !batteryError && !batteryWarningDismissed
              ? [
                  {
                    type: "warning" as FlashbarProps.Type, // Add type assertion
                    content: `Battery Level is at ${batteryLevel}%`,
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    id: "battery-warning",
                    onDismiss: () => setBatteryWarningDismissed(true),
                  },
                ]
              : []),
          ]}
        />
        <AppLayout
        headerSelector="#awsui-top-navigation"
        navigation={<NavigationPanel />}
        navigationOpen={!navigationPanelState.collapsed}
        onNavigationChange={({ detail }) =>
          setNavigationPanelState({ collapsed: !detail.open })
        }
        toolsHide={true}
        {...props}
      />
    </>
  )};
