import { http, HttpResponse } from "msw";
import type {
  BatteryResponse,
  NetworkResponse,
  SensorStatusResponse,
  DriveResponse,
  CalibrationResponse,
  ModelsResponse,
  ModelLoadingResponse,
  SupportedApisResponse,
  DeviceStatusResponse,
  DeviceInfoResponse,
  LogsResponse,
  LedColorResponse,
  TimeResponse,
  SshResponse,
  PasswordResponse,
  SoftwareUpdateBeginResponse,
  ServerReadyResponse,
  AdjustWheelsResponse,
  DeleteModelsResponse,
  ModelInstalledResponse,
} from "./types";

// Mock data generators
const mockBatteryResponse = (): BatteryResponse => ({
  success: true,
  battery_level: 85,
});

const mockNetworkResponse = (): NetworkResponse => ({
  success: true,
  SSID: "DeepRacer-WiFi",
  ip_address: "192.168.1.100",
  is_usb_connected: "false",
});

const mockSensorStatusResponse = (): SensorStatusResponse => ({
  success: true,
  camera_status: "connected",
  stereo_status: "connected",
  lidar_status: "disconnected",
});

const mockModelsResponse = (): ModelsResponse => ({
  success: true,
  models: [
    {
      model_folder_name: "my-racing-model",
      model_sensors: ["camera"],
      is_select_disabled: false,
    },
    {
      model_folder_name: "backup-model",
      model_sensors: ["camera", "lidar"],
      is_select_disabled: false,
    },
  ],
});

const mockSupportedApisResponse = (): SupportedApisResponse => ({
  success: true,
  apis_supported: [
    "/api/get_battery_level",
    "/api/get_network_details",
    "/api/get_sensor_status",
    "/api/start_stop",
    "/api/drive_mode",
    "/api/emergency_stop",
    "/api/models",
    "/api/isModelLoading",
    "/api/supported_apis",
    "/api/get_device_status",
    "/api/get_time",
    "/api/set_led_color",
    "/api/get_led_color",
  ],
});

// API handlers
export const handlers = [
  // Authentication endpoints
  http.get("/login", () => {
    return HttpResponse.text("Login page");
  }),

  http.get("/redirect_login", () => {
    return HttpResponse.json({ success: true });
  }),

  // Battery API
  http.get("/api/get_battery_level", () => {
    return HttpResponse.json(mockBatteryResponse());
  }),

  // Network API
  http.get("/api/get_network_details", () => {
    return HttpResponse.json(mockNetworkResponse());
  }),

  // Sensor status API
  http.get("/api/get_sensor_status", () => {
    return HttpResponse.json(mockSensorStatusResponse());
  }),

  // Vehicle control APIs
  http.post("/api/start_stop", async ({ request }) => {
    await request.json(); // Extract body but don't store it
    const response: DriveResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/drive_mode", async ({ request }) => {
    await request.json(); // Extract body but don't store it
    const response: DriveResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/emergency_stop", () => {
    const response: DriveResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/max_nav_throttle", async ({ request }) => {
    await request.json(); // Extract body but don't store it
    const response: DriveResponse = { success: true };
    return HttpResponse.json(response);
  }),

  // Models API
  http.get("/api/models", () => {
    return HttpResponse.json(mockModelsResponse());
  }),

  http.get("/api/isModelLoading", () => {
    const response: ModelLoadingResponse = {
      success: true,
      isModelLoading: "loaded",
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/models/:modelName/model", () => {
    return HttpResponse.json({ success: true });
  }),

  http.get("/api/uploaded_model_list", () => {
    return HttpResponse.json([
      { name: "model1.tar.gz", size: 1024000 },
      { name: "model2.tar.gz", size: 2048000 },
    ]);
  }),

  http.post("/api/deleteModels", async () => {
    const response: DeleteModelsResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.get("/api/isModelInstalled/:modelName", () => {
    const response: ModelInstalledResponse = {
      success: true,
      modelInstalled: true,
    };
    return HttpResponse.json(response);
  }),

  // Calibration APIs
  http.get("/api/set_calibration_mode", () => {
    const response: CalibrationResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.get("/api/get_calibration/angle", () => {
    const response: CalibrationResponse = {
      success: true,
      mid: "90",
      max: "120",
      min: "60",
    };
    return HttpResponse.json(response);
  }),

  http.get("/api/get_calibration/throttle", () => {
    const response: CalibrationResponse = {
      success: true,
      stopped: 90,
      forward: 110,
      backward: 70,
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/set_calibration/angle", async () => {
    const response: CalibrationResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/set_calibration/throttle", async () => {
    const response: CalibrationResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/adjust_calibrating_wheels/angle", async () => {
    const response: AdjustWheelsResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.post("/api/adjust_calibrating_wheels/throttle", async () => {
    const response: AdjustWheelsResponse = { success: true };
    return HttpResponse.json(response);
  }),

  // Supported APIs
  http.get("/api/supported_apis", () => {
    return HttpResponse.json(mockSupportedApisResponse());
  }),

  // Device status API
  http.get("/api/get_device_status", () => {
    const response: DeviceStatusResponse = {
      success: true,
      temperature: 45.5,
      cpu_usage: 35.2,
      cpu_percent: 35.2,
      memory_usage: 67.8,
      disk_usage: 42.1,
      free_disk: 57.9,
      cpu_temp: 45.5,
      cpu_freq: 1200,
      cpu_freq_max: 1400,
      latency_mean: 12.5,
      latency_p95: 25.3,
      fps_mean: 29.7,
    };
    return HttpResponse.json(response);
  }),

  // Device info API
  http.get("/api/get_device_info", () => {
    const response: DeviceInfoResponse = {
      success: true,
      device_name: "AWS DeepRacer",
      software_version: "4.0.0",
      hardware_version: "Evo",
    };
    return HttpResponse.json(response);
  }),

  // Time API
  http.get("/api/get_time", () => {
    const response: TimeResponse = {
      success: true,
      current_time: new Date().toISOString(),
      timezone: "UTC",
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/set_timezone", async () => {
    return HttpResponse.json({ success: true });
  }),

  // LED API
  http.get("/api/get_led_color", () => {
    const response: LedColorResponse = {
      success: true,
      led_color: { red: 255, green: 0, blue: 0 },
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/set_led_color", async () => {
    const response: LedColorResponse = { success: true };
    return HttpResponse.json(response);
  }),

  // SSH API
  http.get("/api/isSshEnabled", () => {
    const response: SshResponse = {
      success: true,
      is_ssh_enabled: true,
    };
    return HttpResponse.json(response);
  }),

  http.get("/api/enableSsh", () => {
    const response: SshResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.get("/api/disableSsh", () => {
    const response: SshResponse = { success: true };
    return HttpResponse.json(response);
  }),

  http.get("/api/isSshDefaultPasswordChanged", () => {
    const response: SshResponse = {
      success: true,
      is_default_password_changed: true,
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/resetSshPassword", async () => {
    const response: PasswordResponse = {
      success: true,
      message: "Password reset successfully",
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/password", async () => {
    const response: PasswordResponse = {
      success: true,
      message: "Password changed successfully",
    };
    return HttpResponse.json(response);
  }),

  // Software update API
  http.get("/api/begin_software_update", () => {
    const response: SoftwareUpdateBeginResponse = {
      success: true,
      message: "Software update initiated",
    };
    return HttpResponse.json(response);
  }),

  http.get("/api/server_ready", () => {
    const response: ServerReadyResponse = {
      success: true,
      ready: true,
    };
    return HttpResponse.json(response);
  }),

  // Logs API
  http.get("/api/logs/:logType/:count", () => {
    const response: LogsResponse = {
      success: true,
      logs: [
        "[2024-01-01 10:00:00] System initialized",
        "[2024-01-01 10:01:00] Camera connected",
        "[2024-01-01 10:02:00] Model loaded successfully",
      ],
    };
    return HttpResponse.json(response);
  }),

  // Fallback for unhandled requests
  http.all("*", ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json({ success: false, error: "Not implemented in mock" }, { status: 404 });
  }),
];
