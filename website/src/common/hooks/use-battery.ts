import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

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

  // Battery status management
  useEffect(() => {
    let isSubscribed = true;

    const updateBatteryStatus = async () => {
      try {
        const batteryData = await getBatteryStatus();
        if (isSubscribed && batteryData) {
          if (batteryData.success) {
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
        const response = await axios.get("/api/get_battery_level");
        return response.data;
      } catch (error) {
        console.error("Error fetching battery status:", error);
        return null;
      }
    };

    updateBatteryStatus();
    const batteryInterval = setInterval(updateBatteryStatus, BATTERY_INTERVAL_MS);

    // Cleanup function
    return () => {
      isSubscribed = false;
      clearInterval(batteryInterval);
    };
  }, []);

  const batteryContextValue: BatteryState = {
    batteryLevel,
    batteryError,
    hasInitialReading,
    batteryWarningDismissed,
    batteryErrorDismissed,
    setBatteryWarningDismissed,
    setBatteryErrorDismissed,
  };

  return batteryContextValue;
};
