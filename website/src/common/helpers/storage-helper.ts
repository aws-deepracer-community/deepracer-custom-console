import { Mode, applyMode } from "@cloudscape-design/global-styles";
import { NavigationPanelState } from "../types";

const PREFIX = "deepracer";
const THEME_STORAGE_NAME = `${PREFIX}-theme`;
const NAVIGATION_PANEL_STATE_STORAGE_NAME = `${PREFIX}-navigation-panel-state`;
const SPEED_ADJUSTMENT_KEY = `${PREFIX}-speed-adjustment`;
const DEVICE_STATUS_KEY = `${PREFIX}-device-status`;

export abstract class StorageHelper {
  static getTheme() {
    const value = localStorage.getItem(THEME_STORAGE_NAME) ?? Mode.Light;
    const theme = value === Mode.Dark ? Mode.Dark : Mode.Light;

    return theme;
  }

  static applyTheme(theme: Mode) {
    localStorage.setItem(THEME_STORAGE_NAME, theme);
    applyMode(theme);

    document.documentElement.style.setProperty(
      "--app-color-scheme",
      theme === Mode.Dark ? "dark" : "light"
    );

    return theme;
  }

  static getNavigationPanelState(): NavigationPanelState {
    const value =
      localStorage.getItem(NAVIGATION_PANEL_STATE_STORAGE_NAME) ??
      JSON.stringify({
        collapsed: true,
      });

    let state: NavigationPanelState | null = null;
    try {
      state = JSON.parse(value);
    } catch {
      state = {};
    }

    return state ?? {};
  }

  static setNavigationPanelState(state: Partial<NavigationPanelState>) {
    const currentState = this.getNavigationPanelState();
    const newState = { ...currentState, ...state };
    const stateStr = JSON.stringify(newState);
    localStorage.setItem(NAVIGATION_PANEL_STATE_STORAGE_NAME, stateStr);

    return newState;
  }

  // Speed adjustment methods
  static getEnableSpeedAdjustment(): boolean {
    const savedValue = localStorage.getItem(SPEED_ADJUSTMENT_KEY);
    return savedValue ? JSON.parse(savedValue) : false;
  }

  static setEnableSpeedAdjustment(value: boolean): void {
    localStorage.setItem(SPEED_ADJUSTMENT_KEY, JSON.stringify(value));
  }

  // Device status methods
  static getEnableDeviceStatus(): boolean {
    const savedValue = localStorage.getItem(DEVICE_STATUS_KEY);
    return savedValue ? JSON.parse(savedValue) : false;
  }

  static setEnableDeviceStatus(value: boolean): void {
    localStorage.setItem(DEVICE_STATUS_KEY, JSON.stringify(value));
  }
}
