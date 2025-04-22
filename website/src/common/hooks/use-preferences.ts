import { createContext, useContext, useState, useCallback } from "react";
import { StorageHelper } from "../helpers/storage-helper";

export interface Settings {
  enableSpeedAdjustment: boolean;
  enableDeviceStatus: boolean;
}

interface PreferencesContextType {
  settings: Settings;
  setEnableSpeedAdjustment: (value: boolean) => void;
  setEnableDeviceStatus: (value: boolean) => void;
}

export const PreferencesContext = createContext<PreferencesContextType | null>(null);

export const usePreferencesProvider = () => {
  const [settings, setSettings] = useState<Settings>({
    enableSpeedAdjustment: StorageHelper.getEnableSpeedAdjustment(),
    enableDeviceStatus: StorageHelper.getEnableDeviceStatus(),
  });

  const setEnableSpeedAdjustment = useCallback((value: boolean) => {
    StorageHelper.setEnableSpeedAdjustment(value);
    setSettings((prev) => ({ ...prev, enableSpeedAdjustment: value }));
  }, []);

  const setEnableDeviceStatus = useCallback((value: boolean) => {
    StorageHelper.setEnableDeviceStatus(value);
    setSettings((prev) => ({ ...prev, enableDeviceStatus: value }));
  }, []);

  return {
    settings,
    setEnableSpeedAdjustment,
    setEnableDeviceStatus,
  };
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
