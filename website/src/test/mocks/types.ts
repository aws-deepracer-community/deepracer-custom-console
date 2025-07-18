// API response types based on the codebase analysis
export interface BatteryResponse {
  success: boolean;
  battery_level: number;
}

export interface NetworkResponse {
  success: boolean;
  SSID: string;
  ip_address: string;
  is_usb_connected: string;
}

export interface SensorStatusResponse {
  success: boolean;
  camera_status: string;
  stereo_status: string;
  lidar_status: string;
}

export interface DriveResponse {
  success: boolean;
}

export interface CalibrationResponse {
  success: boolean;
  mid?: string;
  max?: string;
  min?: string;
  polarity?: string;
  stopped?: number;
  forward?: number;
  backward?: number;
}

export interface ModelsResponse {
  success: boolean;
  models: Array<{
    model_folder_name: string;
    model_sensors: string[];
    is_select_disabled: boolean;
  }>;
}

export interface ModelLoadingResponse {
  success: boolean;
  isModelLoading: 'loaded' | 'loading' | 'failed' | 'error';
}

export interface SupportedApisResponse {
  success: boolean;
  apis_supported: string[];
}

export interface DeviceStatusResponse {
  success: boolean;
  temperature: number;
  cpu_usage: number;
  cpu_percent: number;
  memory_usage: number;
  disk_usage: number;
  free_disk: number;
  cpu_temp: number;
  cpu_freq: number;
  cpu_freq_max: number;
  latency_mean: number;
  latency_p95: number;
  fps_mean: number;
}

export interface DeviceInfoResponse {
  success: boolean;
  device_name: string;
  software_version: string;
  hardware_version: string;
}

export interface LogsResponse {
  success: boolean;
  logs: string[];
}

export interface LedColorResponse {
  success: boolean;
  led_color?: {
    red: number;
    green: number;
    blue: number;
  };
}

export interface TimeResponse {
  success: boolean;
  current_time: string;
  timezone: string;
}

export interface SshResponse {
  success: boolean;
  is_ssh_enabled?: boolean;
  is_default_password_changed?: boolean;
}

export interface PasswordResponse {
  success: boolean;
  message?: string;
}

export interface SoftwareUpdateBeginResponse {
  success: boolean;
  message?: string;
}

export interface ServerReadyResponse {
  success: boolean;
  ready: boolean;
}

export interface AdjustWheelsResponse {
  success: boolean;
}

export interface DeleteModelsResponse {
  success: boolean;
  message?: string;
}

export interface ModelInstalledResponse {
  success: boolean;
  modelInstalled: boolean;
}
