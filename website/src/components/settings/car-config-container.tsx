import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Header,
  Slider,
  SpaceBetween,
  Tiles,
  TilesProps,
  Toggle,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";
import { useCarConfig, CarConfig, Capabilities, CarConfigResponse } from "../../common/hooks/use-car-config";

// ── Types ────────────────────────────────────────────────────────────────────
// CarConfig, Capabilities, CarConfigResponse are imported from use-car-config

// ── Tile definitions ─────────────────────────────────────────────────────────

/** Case-insensitive match of a config value against a list of canonical tile values. */
function matchCI(value: string | null | undefined, options: string[], fallback: string): string {
  if (!value) return fallback;
  const lower = value.toLowerCase();
  return options.find((o) => o.toLowerCase() === lower) ?? fallback;
}

const LOGGING_MODE_TILES: TilesProps.TilesDefinition[] = [
  { value: "Always", label: "Always", description: "Logs saved regardless of USB drive presence" },
  { value: "USBOnly", label: "USB only", description: "Logs saved to a connected USB drive only" },
  { value: "Never", label: "Never", description: "Logs are not collected" },
];

const LOGGING_PROVIDER_TILES: TilesProps.TilesDefinition[] = [
  { value: "sqlite3", label: "SQLite3", description: "Lightweight single-file database, compatible with all ROS distros" },
  { value: "mcap", label: "MCAP", description: "Modern container format for ROS 2 Humble and later" },
];

const STEERING_MODE_TILES: TilesProps.TilesDefinition[] = [
  {
    value: "servo",
    label: "Servo",
    description: "Standard DeepRacer servo and ESC drivetrain",
  },
  {
    value: "diffdrive",
    label: (
      <SpaceBetween direction="horizontal" size="xs">
        <span>Differential Drive</span>
        <Badge color="blue">Beta</Badge>
      </SpaceBetween>
    ),
    description: "Direct motor control via the diff-drive package",
  },
];

const CAMERA_MODE_TILES: TilesProps.TilesDefinition[] = [
  {
    value: "auto",
    label: "Auto",
    description: "Selects V4L2 or libcamera based on active ROS distro",
  },
  {
    value: "legacy",
    label: "Legacy (V4L2)",
    description: "Compatible with original DeepRacer firmware",
  },
  {
    value: "modern",
    label: "Modern (libcamera)",
    description: "Required for ROS Humble and later",
  },
];

const INFERENCE_ENGINE_LABELS: Record<string, string> = {
  TFLITE: "TensorFlow Lite",
  OV: "OpenVINO",
};
const INFERENCE_DEVICE_LABELS: Record<string, string> = {
  CPU: "CPU",
  GPU: "GPU",
  MYRIAD: "Myriad X",
};
const INFERENCE_DESCRIPTIONS: Record<string, string> = {
  auto: "Automatically detected based on available hardware and software",
  TFLITE: "TensorFlow Lite on CPU — optimised for ARM-based devices",
  "OV-CPU": "Intel OpenVINO on CPU — default for x86_64 hosts",
  "OV-GPU": "Intel OpenVINO on integrated Intel GPU",
  "OV-MYRIAD": "Intel OpenVINO on the Myriad X VPU",
};

interface InferenceTile extends TilesProps.TilesDefinition {
  engine: string;
  device: string;
}

function buildInferenceTiles(capabilities: Capabilities | null): InferenceTile[] {
  const tiles: InferenceTile[] = [
    {
      value: "auto",
      label: "Auto",
      description: INFERENCE_DESCRIPTIONS.auto,
      engine: "auto",
      device: "auto",
    },
  ];
  for (const engine of capabilities?.inference_engines ?? []) {
    const devices = capabilities?.inference_devices[engine] ?? [];
    if (devices.length <= 1) {
      const device = devices[0] ?? "CPU";
      tiles.push({
        value: engine,
        label: INFERENCE_ENGINE_LABELS[engine] ?? engine,
        description:
          INFERENCE_DESCRIPTIONS[engine] ??
          `${INFERENCE_ENGINE_LABELS[engine] ?? engine} on ${INFERENCE_DEVICE_LABELS[device] ?? device}`,
        engine,
        device,
      });
    } else {
      for (const device of devices) {
        const tileValue = `${engine}-${device}`;
        tiles.push({
          value: tileValue,
          label: `${INFERENCE_ENGINE_LABELS[engine] ?? engine} – ${INFERENCE_DEVICE_LABELS[device] ?? device}`,
          description:
            INFERENCE_DESCRIPTIONS[tileValue] ??
            `${INFERENCE_ENGINE_LABELS[engine] ?? engine} on ${INFERENCE_DEVICE_LABELS[device] ?? device}`,
          engine,
          device,
        });
      }
    }
  }
  return tiles;
}

function inferenceToTileValue(engine: string, device: string, tiles: InferenceTile[]): string {
  const match = tiles.find((t) => t.engine === engine && t.device === device);
  if (match) return match.value;
  const byEngine = tiles.find((t) => t.engine === engine);
  return byEngine?.value ?? "auto";
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CarConfigContainer = () => {
  const { config: contextConfig, capabilities, isLoading, refresh } = useCarConfig();
  const [draft, setDraft] = useState<CarConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<CarConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Normalise the raw config from context whenever it changes (and reset draft if not dirty)
  useEffect(() => {
    if (!contextConfig) {
      setDraft(null);
      setSavedConfig(null);
      return;
    }
    const cfg = contextConfig;
    const caps = capabilities;
    const engines = ["auto", ...(caps?.inference_engines ?? [])];
    const normEngine = matchCI(cfg.inference.engine, engines, "auto");
    const devices = ["auto", ...(caps?.inference_devices[normEngine] ?? [])];
    const withDefaults: CarConfig = {
      ...cfg,
      camera: {
        ...cfg.camera,
        mode: matchCI(cfg.camera.mode, CAMERA_MODE_TILES.map((t) => t.value), "auto"),
        orientation: cfg.camera.orientation === 180 ? 180 : 0,
        enable_gray_overlay: cfg.camera.enable_gray_overlay ?? false,
      },
      inference: {
        ...cfg.inference,
        engine: normEngine,
        device: matchCI(cfg.inference.device, devices, "auto"),
      },
      steering: {
        ...cfg.steering,
        mode: matchCI(cfg.steering?.mode, STEERING_MODE_TILES.map((t) => t.value), "servo"),
      },
      logging: {
        ...cfg.logging,
        mode: matchCI(cfg.logging.mode, LOGGING_MODE_TILES.map((t) => t.value), "Never"),
        provider: matchCI(cfg.logging.provider, LOGGING_PROVIDER_TILES.map((t) => t.value), "sqlite3"),
      },
      imu: {
        enabled: cfg.imu?.enabled ?? false,
        crash_threshold_g: cfg.imu?.crash_threshold_g ?? 0,
        pickup_threshold_g: cfg.imu?.pickup_threshold_g ?? 0,
      },
    };
    setSavedConfig(withDefaults);
    // Reset draft to the refreshed config (Refresh button behaviour)
    setDraft(withDefaults);
  }, [contextConfig, capabilities]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const response = await ApiHelper.post<CarConfigResponse>("car_config", draft);
    if (response?.success) {
      setSavedConfig(draft); // immediately mark as not dirty
      refresh(); // also update global context
      setSaveSuccess(true);
    } else {
      setSaveError(response?.reason ?? "Failed to save configuration.");
    }
    setIsSaving(false);
  };

  const handleRefresh = () => {
    if (savedConfig) setDraft(savedConfig); // discard unsaved local changes immediately
    refresh(); // trigger context re-fetch from server
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedConfig);

  const updateLogging = (value: string) => {
    setDraft((prev) => prev && { ...prev, logging: { ...prev.logging, mode: value } });
  };

  const updateLoggingProvider = (value: string) => {
    setDraft((prev) => prev && { ...prev, logging: { ...prev.logging, provider: value } });
  };

  const updateCamera = (value: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        camera: {
          ...prev.camera,
          mode: value,
          orientation: value === "modern" ? (prev.camera.orientation === 180 ? 180 : 0) : 0,
        },
      };
    });
  };

  const updateCameraOrientation = (checked: boolean) => {
    setDraft((prev) =>
      prev && { ...prev, camera: { ...prev.camera, orientation: checked ? 180 : 0 } }
    );
  };

  const updateGrayOverlay = (checked: boolean) => {
    setDraft((prev) => prev && { ...prev, camera: { ...prev.camera, enable_gray_overlay: checked } });
  };

  const updateSteering = (value: string) => {
    setDraft((prev) => prev && { ...prev, steering: { mode: value } });
  };

  const updateImuEnabled = (checked: boolean) => {
    setDraft((prev) => prev && { ...prev, imu: { ...prev.imu, enabled: checked } });
  };

  // Index-based sliders: index 0 = Disabled, index N = Nth threshold value.
  // This eliminates any intermediate invalid positions.
  const IMU_CRASH_STEPS = [0, 1.5, 2.0, 2.5, 3.0];
  const IMU_PICKUP_STEPS = [0, 0.5, 0.75, 0.95];

  const updateImuCrash = (index: number) => {
    setDraft((prev) => prev && { ...prev, imu: { ...prev.imu, crash_threshold_g: IMU_CRASH_STEPS[index] ?? 0 } });
  };

  const updateImuPickup = (index: number) => {
    setDraft((prev) => prev && { ...prev, imu: { ...prev.imu, pickup_threshold_g: IMU_PICKUP_STEPS[index] ?? 0 } });
  };

  // ── Derived tile data ────────────────────────────────────────────────────────
  const inferenceTiles = buildInferenceTiles(capabilities);
  const currentInferenceTileValue = inferenceToTileValue(
    draft?.inference.engine ?? "auto",
    draft?.inference.device ?? "auto",
    inferenceTiles
  );

  const cameraTiles = CAMERA_MODE_TILES.filter(
    (t) => t.value === "auto" || capabilities?.camera_modes?.includes(t.value)
  );
  const isCameraOrientationSupported = capabilities?.camera_orientations?.includes(180) === true;
  const showCameraOrientationControl =
    draft?.camera.mode === "modern" && isCameraOrientationSupported;

  const steeringTiles = STEERING_MODE_TILES.filter((t) =>
    capabilities?.steering_modes?.includes(t.value)
  );

  const updateInference = (tileValue: string) => {
    const tile = inferenceTiles.find((t) => t.value === tileValue);
    if (!tile) return;
    setDraft(
      (prev) => prev && { ...prev, inference: { engine: tile.engine, device: tile.device } }
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SpaceBetween size="l">
      {saveSuccess && (
        <Alert type="warning">
          Configuration saved. Restart the DeepRacer service for changes to take effect.
        </Alert>
      )}
      {saveError && (
        <Alert type="error" dismissible onDismiss={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <Container
        header={
          <Header variant="h2">
            Logging
          </Header>
        }
      >
        <SpaceBetween size="l">
          <div>
            <Header variant="h3" description="Controls when driving logs are recorded to a ROS bag.">
              Mode
            </Header>
            <Tiles
              value={draft?.logging.mode ?? null}
              items={LOGGING_MODE_TILES.map((t) => ({ ...t, disabled: isLoading }))}
              onChange={({ detail }) => updateLogging(detail.value)}
            />
          </div>
          {(capabilities?.logging_providers?.length ?? 0) > 1 && (
            <div>
              <Header variant="h3" description="Storage format used when writing ROS bag files.">
                Storage Provider
              </Header>
              <Tiles
                value={draft?.logging.provider ?? null}
                items={LOGGING_PROVIDER_TILES.filter((t) =>
                  capabilities?.logging_providers?.includes(t.value)
                ).map((t) => ({ ...t, disabled: isLoading }))}
                onChange={({ detail }) => updateLoggingProvider(detail.value)}
              />
            </div>
          )}
        </SpaceBetween>
      </Container>

      {(cameraTiles.length >= 3 || capabilities?.gray_overlay) && (
        <Container
          header={
            <Header
              variant="h2"
              description="Controls the camera that is used to capture the video feed."
            >
              Camera
            </Header>
          }
        >
          <SpaceBetween size="l">
            {cameraTiles.length >= 3 && (
              <div>
                <Header variant="h3" description="Controls which camera driver is used.">
                  Mode
                </Header>
                <Tiles
                  value={draft?.camera.mode ?? null}
                  items={cameraTiles.map((t) => ({ ...t, disabled: isLoading }))}
                  onChange={({ detail }) => updateCamera(detail.value)}
                />
              </div>
            )}
            {capabilities?.gray_overlay && (
              <div>
                <Header variant="h3" description="Apply a gray fade over the top of the camera image to reduce background influence during inference.">
                  Gray overlay
                </Header>
                <Toggle
                  checked={draft?.camera.enable_gray_overlay ?? false}
                  disabled={isLoading}
                  onChange={({ detail }) => updateGrayOverlay(detail.checked)}
                >
                  {draft?.camera.enable_gray_overlay ? "Enabled" : "Disabled"}
                </Toggle>
              </div>
            )}
            {showCameraOrientationControl && (
              <div>
                <Header variant="h3" description="Rotate camera feed by 180 degrees (libcamera only).">
                  Camera rotation
                </Header>
                <Toggle
                  checked={(draft?.camera.orientation ?? 0) === 180}
                  disabled={isLoading}
                  onChange={({ detail }) => updateCameraOrientation(detail.checked)}
                >
                  {(draft?.camera.orientation ?? 0) === 180 ? "180 deg" : "0 deg"}
                </Toggle>
              </div>
            )}
          </SpaceBetween>
        </Container>
      )}

      {inferenceTiles.length >= 3 && (
        <Container
          header={
            <Header
              variant="h2"
              description="Selects the hardware component that runs the neural network model during autonomous driving."
            >
              Inference Engine
            </Header>
          }
        >
          <Tiles
            value={currentInferenceTileValue}
            items={inferenceTiles.map((t) => ({ ...t, disabled: isLoading }))}
            onChange={({ detail }) => updateInference(detail.value)}
          />
        </Container>
      )}

      {steeringTiles.length >= 2 && (
        <Container
          header={
            <Header
              variant="h2"
              description="Selects the drivetrain type. Change this only if you have modified the car hardware."
            >
              Steering Mode
            </Header>
          }
        >
          <Tiles
            value={draft?.steering.mode ?? null}
            items={steeringTiles.map((t) => ({ ...t, disabled: isLoading }))}
            onChange={({ detail }) => updateSteering(detail.value)}
          />
        </Container>
      )}

      {capabilities?.imu && (
        <Container
          header={
            <Header
              variant="h2"
              description="Configure the BMI160 IMU safety features. Changes take effect on next service restart."
            >
              IMU
            </Header>
          }
        >
          <SpaceBetween size="l">
            <div>
              <Header variant="h3" description="Enable the IMU node. Required for crash and pickup detection.">
                Enable IMU
              </Header>
              <Toggle
                checked={draft?.imu.enabled ?? false}
                disabled={isLoading}
                onChange={({ detail }) => updateImuEnabled(detail.checked)}
              >
                {draft?.imu.enabled ? "Enabled" : "Disabled"}
              </Toggle>
            </div>
            {draft?.imu.enabled && (
              <>
                <div>
                  <Header variant="h3" description="Stop the car when a high-G impact is detected. Set to Disabled to turn off.">
                    Crash Detection
                  </Header>
                  <Slider
                    value={IMU_CRASH_STEPS.indexOf(draft?.imu.crash_threshold_g ?? 0)}
                    min={0}
                    max={IMU_CRASH_STEPS.length - 1}
                    step={1}
                    referenceValues={IMU_CRASH_STEPS.map((_, i) => i)}
                    disabled={isLoading}
                    valueFormatter={(i) => i === 0 ? "Disabled" : `${IMU_CRASH_STEPS[i]} G`}
                    onChange={({ detail }) => updateImuCrash(detail.value)}
                  />
                </div>
                <div>
                  <Header variant="h3" description="Stop the car when it is picked up or tipped over. Set to Disabled to turn off.">
                    Pickup Detection
                  </Header>
                  <Slider
                    value={IMU_PICKUP_STEPS.indexOf(draft?.imu.pickup_threshold_g ?? 0)}
                    min={0}
                    max={IMU_PICKUP_STEPS.length - 1}
                    step={1}
                    referenceValues={IMU_PICKUP_STEPS.map((_, i) => i)}
                    disabled={isLoading}
                    valueFormatter={(i) => i === 0 ? "Disabled" : `${IMU_PICKUP_STEPS[i]} G`}
                    onChange={({ detail }) => updateImuPickup(detail.value)}
                  />
                </div>
              </>
            )}
          </SpaceBetween>
        </Container>
      )}

      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={handleRefresh} disabled={isLoading || isSaving}>
            Refresh
          </Button>
          <Button
            variant="primary"
            loading={isSaving}
            disabled={!isDirty || isLoading}
            onClick={handleSave}
          >
            Save
          </Button>
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );
};
