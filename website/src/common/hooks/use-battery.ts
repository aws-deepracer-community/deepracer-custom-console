import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./use-authentication";
import { FlashbarProps } from "@cloudscape-design/components";
import { useApi } from "./use-api";

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
  const [pageLoadTime] = useState<number>(Date.now());
  const { isAuthenticated } = useAuth();
  const { get: apiGet } = useApi();

  // Separate state for battery data (without functions)
  const [batteryState, setBatteryState] = useState({
    batteryLevel: 0,
    batteryError: false,
    hasInitialReading: false,
    batteryWarningDismissed: false,
    batteryErrorDismissed: false,
    batteryFlashbarItems: [] as FlashbarProps.MessageDefinition[],
  });

  // Setter functions outside of state to prevent recreation
  const setBatteryWarningDismissed = (dismissed: boolean) => {
    setBatteryState((prev) => ({ ...prev, batteryWarningDismissed: dismissed }));
  };

  const setBatteryErrorDismissed = (dismissed: boolean) => {
    setBatteryState((prev) => ({ ...prev, batteryErrorDismissed: dismissed }));
  };

  // Update battery notifications whenever relevant state changes
  useEffect(() => {
    const hasBeenTenSeconds = Date.now() - pageLoadTime >= BATTERY_INTERVAL_MS;

    const notifications: FlashbarProps.MessageDefinition[] = [];

    // Only show notifications if authenticated
    if (isAuthenticated) {
      // Battery error notification
      if (
        (batteryState.batteryError || (!batteryState.hasInitialReading && hasBeenTenSeconds)) &&
        !batteryState.batteryErrorDismissed
      ) {
        notifications.push({
          type: "error" as FlashbarProps.Type,
          content:
            !batteryState.hasInitialReading && hasBeenTenSeconds
              ? "Unable to get battery reading"
              : "Vehicle battery is not connected",
          dismissible: true,
          dismissLabel: "Dismiss message",
          id: "battery-error",
          onDismiss: () => setBatteryErrorDismissed(true),
        });
      }

      // Battery warning notification
      if (
        batteryState.batteryLevel <= 40 &&
        !batteryState.batteryError &&
        !batteryState.batteryWarningDismissed &&
        batteryState.hasInitialReading
      ) {
        notifications.push({
          type: "warning" as FlashbarProps.Type,
          content: `Battery Level is at ${batteryState.batteryLevel}%`,
          dismissible: true,
          dismissLabel: "Dismiss message",
          id: "battery-warning",
          onDismiss: () => setBatteryWarningDismissed(true),
        });
      }
    }

    setBatteryState((prev) => ({ ...prev, batteryFlashbarItems: notifications }));
  }, [
    batteryState.batteryLevel,
    batteryState.batteryError,
    batteryState.hasInitialReading,
    batteryState.batteryWarningDismissed,
    batteryState.batteryErrorDismissed,
    pageLoadTime,
    isAuthenticated,
  ]);

  // Battery status management
  useEffect(() => {
    // Don't fetch battery data if not authenticated
    if (!isAuthenticated) {
      return;
    }

    // Don't fetch battery data if on system-unavailable page
    if (window.location.hash.includes("/system-unavailable")) {
      return;
    }

    let isSubscribed = true;

    const updateBatteryStatus = async () => {
      try {
        const batteryData = await apiGet<BatteryResponse>("get_battery_level");
        if (isSubscribed && batteryData) {
          if (batteryData.success) {
            setBatteryState((prev) => ({
              ...prev,
              ...(prev.hasInitialReading ? {} : { hasInitialReading: true }),
              batteryError: batteryData.battery_level === -1,
              batteryLevel:
                batteryData.battery_level === -1 ? 0 : (batteryData.battery_level / 10) * 100,
              batteryWarningDismissed:
                batteryData.battery_level === -1 ? false : prev.batteryWarningDismissed,
              // Only reset error dismissal if the error state is changing from false to true
              batteryErrorDismissed:
                batteryData.battery_level === -1 && !prev.batteryError
                  ? false
                  : prev.batteryErrorDismissed,
            }));

            if (batteryData.battery_level === -1) {
              console.debug("Battery level is -1, indicating battery not connected");
            } else {
              const calculatedLevel = (batteryData.battery_level / 10) * 100;
              console.debug(
                `Setting battery level to ${calculatedLevel}% (raw: ${batteryData.battery_level})`
              );
              if (batteryData.battery_level <= 4) {
                console.debug(`Low battery warning: ${batteryData.battery_level}/10`);
                // Only reset warning dismissal if we're transitioning to low battery from non-low battery
                setBatteryState((prev) => ({
                  ...prev,
                  batteryWarningDismissed:
                    prev.batteryLevel > 40 ? false : prev.batteryWarningDismissed,
                }));
              }
            }
          } else {
            console.warn("Battery data success flag is false", batteryData);
          }
        }
      } catch (error) {
        console.error("Error updating battery status:", error);
        if (isSubscribed) {
          setBatteryState((prev) => ({
            ...prev,
            batteryError: true,
            batteryLevel: 0,
            // Only reset warning dismissal if we're transitioning from non-error to error
            batteryWarningDismissed: !prev.batteryError ? false : prev.batteryWarningDismissed,
            // Only reset error dismissal if we're transitioning from no error to error
            batteryErrorDismissed: !prev.batteryError ? false : prev.batteryErrorDismissed,
          }));
        }
      }
    };

    console.debug("Initializing battery monitoring");

    if (!batteryState.hasInitialReading) {
      updateBatteryStatus();
    }
    const batteryInterval = setInterval(updateBatteryStatus, BATTERY_INTERVAL_MS);
    console.debug(`Battery monitoring interval set: ${BATTERY_INTERVAL_MS}ms`);

    // Cleanup function
    return () => {
      console.debug("Cleaning up battery monitoring");
      isSubscribed = false;
      clearInterval(batteryInterval);
    };
  }, [isAuthenticated, apiGet, batteryState.hasInitialReading]); // Add isAuthenticated as a dependency

  return batteryState;
};
