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
