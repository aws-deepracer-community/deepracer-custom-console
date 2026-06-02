import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Header,
  SpaceBetween,
  Tiles,
  TilesProps,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";

// ── Types ────────────────────────────────────────────────────────────────────

interface CarConfig {
  logging: {
    mode: string;
    provider: string;
  };
  camera: {
    mode: string;
  };
  inference: {
    engine: string;
    device: string;
  };
  steering: {
    mode: string;
  };
}

interface Capabilities {
  camera_modes: string[];
  logging_modes: string[];
  logging_providers: string[];
  inference_engines: string[];
  inference_devices: Record<string, string[]>;
  steering_modes: string[];
}

interface CarConfigResponse {
  success: boolean;
  config: CarConfig;
  capabilities?: Capabilities;
  reason?: string;
}

// ── Tile definitions ─────────────────────────────────────────────────────────

/** Case-insensitive match of a config value against a list of canonical tile values. */
function matchCI(value: string | null | undefined, options: string[], fallback: string): string {
  if (!value) return fallback;
  const lower = value.toLowerCase();
  return options.find((o) => o.toLowerCase() === lower) ?? fallback;
}

const LOGGING_MODE_TILES: TilesProps.TilesDefinition[] = [
  { value: "Never", label: "Never", description: "Logs are not collected" },
  { value: "USBOnly", label: "USB only", description: "Logs saved to a connected USB drive only" },
  { value: "Always", label: "Always", description: "Logs saved regardless of USB drive presence" },
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
  const [config, setConfig] = useState<CarConfig | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [draft, setDraft] = useState<CarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Fetch current config ────────────────────────────────────────────────────
  const fetchConfig = async () => {
    setIsLoading(true);
    const data = await ApiHelper.get<CarConfigResponse>("car_config");
    if (data?.success) {
      const cfg = data.config;
      const caps = data.capabilities;
      const engines = ["auto", ...(caps?.inference_engines ?? [])];
      const normEngine = matchCI(cfg.inference.engine, engines, "auto");
      const devices = ["auto", ...(caps?.inference_devices[normEngine] ?? [])];
      const withDefaults: CarConfig = {
        ...cfg,
        logging: {
          ...cfg.logging,
          mode: matchCI(
            cfg.logging.mode,
            LOGGING_MODE_TILES.map((t) => t.value),
            "Never"
          ),
        },
        camera: {
          ...cfg.camera,
          mode: matchCI(
            cfg.camera.mode,
            CAMERA_MODE_TILES.map((t) => t.value),
            "auto"
          ),
        },
        inference: {
          ...cfg.inference,
          engine: normEngine,
          device: matchCI(cfg.inference.device, devices, "auto"),
        },
        steering: {
          ...cfg.steering,
          mode: matchCI(
            cfg.steering?.mode,
            STEERING_MODE_TILES.map((t) => t.value),
            "servo"
          ),
        },
      };
      setConfig(withDefaults);
      setCapabilities(caps ?? null);
      setDraft(withDefaults);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const response = await ApiHelper.post<CarConfigResponse>("car_config", draft);
    if (response?.success) {
      const cfg = response.config;
      const caps = capabilities;
      const engines = ["auto", ...(caps?.inference_engines ?? [])];
      const normEngine = matchCI(cfg.inference.engine, engines, "auto");
      const devices = ["auto", ...(caps?.inference_devices[normEngine] ?? [])];
      const withDefaults: CarConfig = {
        ...cfg,
        logging: {
          ...cfg.logging,
          mode: matchCI(
            cfg.logging.mode,
            LOGGING_MODE_TILES.map((t) => t.value),
            "Never"
          ),
        },
        camera: {
          ...cfg.camera,
          mode: matchCI(
            cfg.camera.mode,
            CAMERA_MODE_TILES.map((t) => t.value),
            "auto"
          ),
        },
        inference: {
          ...cfg.inference,
          engine: normEngine,
          device: matchCI(cfg.inference.device, devices, "auto"),
        },
        steering: {
          ...cfg.steering,
          mode: matchCI(
            cfg.steering?.mode,
            STEERING_MODE_TILES.map((t) => t.value),
            "servo"
          ),
        },
      };
      setConfig(withDefaults);
      setDraft(withDefaults);
      setSaveSuccess(true);
    } else {
      setSaveError(response?.reason ?? "Failed to save configuration.");
    }
    setIsSaving(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isDirty = JSON.stringify(draft) !== JSON.stringify(config);

  const updateLogging = (value: string) => {
    setDraft((prev) => prev && { ...prev, logging: { ...prev.logging, mode: value } });
  };

  const updateCamera = (value: string) => {
    setDraft((prev) => prev && { ...prev, camera: { ...prev.camera, mode: value } });
  };

  const updateSteering = (value: string) => {
    setDraft((prev) => prev && { ...prev, steering: { mode: value } });
  };

  // ── Derived tile data ────────────────────────────────────────────────────────
  const inferenceTiles = buildInferenceTiles(capabilities);
  const currentInferenceTileValue = inferenceToTileValue(
    draft?.inference.engine ?? "auto",
    draft?.inference.device ?? "auto",
    inferenceTiles
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
          <Header variant="h2" description="Controls when driving logs are recorded to a ROS bag.">
            Logging Mode
          </Header>
        }
      >
        <Tiles
          value={draft?.logging.mode ?? null}
          items={LOGGING_MODE_TILES.map((t) => ({ ...t, disabled: isLoading }))}
          onChange={({ detail }) => updateLogging(detail.value)}
        />
      </Container>

      <Container
        header={
          <Header
            variant="h2"
            description="Controls which camera driver is used to capture the video feed."
          >
            Camera Mode
          </Header>
        }
      >
        <Tiles
          value={draft?.camera.mode ?? null}
          items={CAMERA_MODE_TILES.map((t) => ({ ...t, disabled: isLoading }))}
          onChange={({ detail }) => updateCamera(detail.value)}
        />
      </Container>

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
          items={STEERING_MODE_TILES.map((t) => ({ ...t, disabled: isLoading }))}
          onChange={({ detail }) => updateSteering(detail.value)}
        />
      </Container>

      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={fetchConfig} disabled={isLoading || isSaving}>
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
