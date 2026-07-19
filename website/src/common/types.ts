export interface NavigationPanelState {
  collapsed?: boolean;
  collapsedSections?: Record<number, boolean>;
}

export interface SoftwareUpdateBeginResponse {
  success: boolean;
  reason?: string;
}

export interface SoftwareUpdateStatusData {
  status: string;
  update_pct: number;
}

export interface ServerReadyResponse {
  success: boolean;
  status: boolean;
}

export type CameraParameterValue =
  | boolean
  | number
  | string
  | boolean[]
  | number[]
  | string[]
  | null;

export type CameraParameterType =
  | "boolean"
  | "integer"
  | "double"
  | "string"
  | "byte_array"
  | "boolean_array"
  | "integer_array"
  | "double_array"
  | "string_array"
  | "not_set";

export interface CameraParameter {
  name: string;
  value: CameraParameterValue;
  type: CameraParameterType;
  read_only?: boolean;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface CameraParametersResponse {
  status: "success" | "error";
  params?: CameraParameter[];
  message?: string;
}

export interface CameraSetParameterResponse {
  status: "success" | "error";
  parameter?: string;
  new_value?: CameraParameterValue;
  message?: string;
}
