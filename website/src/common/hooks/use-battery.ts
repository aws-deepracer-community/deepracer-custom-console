import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./use-authentication";
import { FlashbarProps } from "@cloudscape-design/components";
import { ApiHelper } from "../helpers/api-helper";

// Add new interface for API response
interface BatteryResponse {
  success: boolean;
  battery_level: number;
}
// Constants
const BATTERY_INTERVAL_MS = 10000;

// Battery Context
interface BatteryState {
  batteryLevel: number;
  batteryError: boolean;
  hasInitialReading: boolean;
  batteryWarningDismissed: boolean;
  batteryErrorDismissed: boolean;
  setBatteryWarningDismissed: (dismissed: boolean) => void;
  setBatteryErrorDismissed: (dismissed: boolean) => void;
  // Add battery flashbar items
  batteryFlashbarItems: FlashbarProps.MessageDefinition[];
}

export const BatteryContext = createContext<BatteryState | null>(null);

export const useBattery = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error("useBattery must be used within a BatteryProvider");
  }
  return context;
};

export const useBatteryProvider = () => {
  // Battery state
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [batteryError, setBatteryError] = useState<boolean>(false);
  const [batteryWarningDismissed, setBatteryWarningDismissed] = useState(false);
  const [batteryErrorDismissed, setBatteryErrorDismissed] = useState(false);
  const [hasInitialReading, setHasInitialReading] = useState(false);
  const [pageLoadTime] = useState<number>(Date.now());
  const { isAuthenticated } = useAuth();

  // Battery notifications state
  const [batteryFlashbarItems, setBatteryFlashbarItems] = useState<
    FlashbarProps.MessageDefinition[]
  >([]);

  // Update battery notifications whenever relevant state changes
  useEffect(() => {
    const hasBeenTenSeconds = Date.now() - pageLoadTime >= 10000;
    const notifications: FlashbarProps.MessageDefinition[] = [];

    // Only show notifications if authenticated
    if (isAuthenticated) {
      // Battery error notification
      if ((batteryError || (!hasInitialReading && hasBeenTenSeconds)) && !batteryErrorDismissed) {
        notifications.push({
          type: "error" as FlashbarProps.Type,
          content:
            !hasInitialReading && hasBeenTenSeconds
              ? "Unable to get battery reading"
              : "Vehicle battery is not connected",
          dismissible: true,
          dismissLabel: "Dismiss message",
          id: "battery-error",
          onDismiss: () => setBatteryErrorDismissed(true),
        });
      }

      // Battery warning notification
      if (batteryLevel <= 40 && !batteryError && !batteryWarningDismissed && hasInitialReading) {
        notifications.push({
          type: "warning" as FlashbarProps.Type,
          content: `Battery Level is at ${batteryLevel}%`,
          dismissible: true,
          dismissLabel: "Dismiss message",
          id: "battery-warning",
          onDismiss: () => setBatteryWarningDismissed(true),
        });
      }
    }

    setBatteryFlashbarItems(notifications);
  }, [
    batteryLevel,
    batteryError,
    hasInitialReading,
    batteryWarningDismissed,
    batteryErrorDismissed,
    pageLoadTime,
    isAuthenticated,
  ]);

  // Battery status management
  useEffect(() => {
    // Don't fetch battery data if not authenticated
    if (!isAuthenticated) {
      return;
    }

    let isSubscribed = true;

    const updateBatteryStatus = async () => {
      try {
        const batteryData = await getBatteryStatus();
        if (isSubscribed && batteryData) {
          if (batteryData.success) {
            setHasInitialReading(true);
            if (batteryData.battery_level === -1) {
              console.debug("Battery level is -1, indicating battery not connected");
              setBatteryError(true);
              setBatteryLevel(0);
              setBatteryWarningDismissed(false);
              setBatteryErrorDismissed(false);
            } else {
              const calculatedLevel = (batteryData.battery_level / 10) * 100;
              console.debug(
                `Setting battery level to ${calculatedLevel}% (raw: ${batteryData.battery_level})`
              );
              setBatteryError(false);
              setBatteryLevel(calculatedLevel);
              setBatteryErrorDismissed(false);
              if (batteryData.battery_level <= 4) {
                console.debug(`Low battery warning: ${batteryData.battery_level}/10`);
                setBatteryWarningDismissed(false);
              }
            }
          } else {
            console.warn("Battery data success flag is false", batteryData);
          }
        }
      } catch (error) {
        console.error("Error updating battery status:", error);
        if (isSubscribed) {
          setBatteryError(true);
          setBatteryLevel(0);
          setBatteryWarningDismissed(false);
          setBatteryErrorDismissed(false);
        }
      }
    };

    const getBatteryStatus = async () => {
      try {
        const response = await ApiHelper.get<BatteryResponse>("get_battery_level");
        return response;
      } catch (error) {
        console.error("Error fetching battery status:", error);
        return null;
      }
    };

    console.debug("Initializing battery monitoring");
    updateBatteryStatus();
    const batteryInterval = setInterval(updateBatteryStatus, BATTERY_INTERVAL_MS);
    console.debug(`Battery monitoring interval set: ${BATTERY_INTERVAL_MS}ms`);

    // Cleanup function
    return () => {
      console.debug("Cleaning up battery monitoring");
      isSubscribed = false;
      clearInterval(batteryInterval);
    };
  }, [isAuthenticated]); // Add isAuthenticated as a dependency

  const batteryContextValue: BatteryState = {
    batteryLevel,
    batteryError,
    hasInitialReading,
    batteryWarningDismissed,
    batteryErrorDismissed,
    setBatteryWarningDismissed,
    setBatteryErrorDismissed,
    batteryFlashbarItems,
  };

  return batteryContextValue;
};
