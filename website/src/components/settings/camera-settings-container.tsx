import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ColumnLayout,
  Container,
  FormField,
  Header,
  Input,
  Slider,
  SpaceBetween,
  Spinner,
  Toggle,
} from "@cloudscape-design/components";
import { useCamera } from "../../common/hooks/use-camera";
import { CameraParameter, CameraParameterType, CameraParameterValue } from "../../common/types";

type DraftValue = boolean | number | string | string[];

const PARAMETER_PRIORITY = [
  "AeEnable",
  "ExposureTime",
  "AnalogueGain",
  "AwbEnable",
  "ColourGains",
  "Brightness",
  "Contrast",
  "Saturation",
  "Sharpness",
];

const NUMERIC_TYPES: CameraParameterType[] = ["integer", "double"];
const ARRAY_TYPES: CameraParameterType[] = [
  "byte_array",
  "boolean_array",
  "integer_array",
  "double_array",
  "string_array",
];

function labelForParameter(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^Ae\b/, "AE")
    .replace(/^Awb\b/, "AWB");
}

function hasNumericRange(
  parameter: CameraParameter
): parameter is CameraParameter & { value: number; min: number; max: number } {
  return (
    NUMERIC_TYPES.includes(parameter.type) &&
    typeof parameter.value === "number" &&
    typeof parameter.min === "number" &&
    typeof parameter.max === "number" &&
    parameter.min < parameter.max
  );
}

function toDraftValue(parameter: CameraParameter): DraftValue {
  if (parameter.type === "boolean") {
    return parameter.value === true;
  }
  if (hasNumericRange(parameter)) {
    return Number(parameter.value);
  }
  if (ARRAY_TYPES.includes(parameter.type)) {
    return Array.isArray(parameter.value) ? parameter.value.map((value) => String(value)) : [];
  }
  return parameter.value == null ? "" : String(parameter.value);
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseNumber(value: string | number, integer: boolean) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Enter a numeric value.");
  }
  return integer ? Math.trunc(parsed) : parsed;
}

function toParameterValue(parameter: CameraParameter, draftValue: DraftValue): CameraParameterValue {
  if (parameter.type === "boolean") {
    return draftValue === true;
  }
  if (parameter.type === "integer") {
    return parseNumber(draftValue as string | number, true);
  }
  if (parameter.type === "double") {
    return parseNumber(draftValue as string | number, false);
  }
  if (parameter.type === "string") {
    return String(draftValue);
  }

  const values = Array.isArray(draftValue) ? draftValue : [];
  if (parameter.type === "boolean_array") {
    return values.map(parseBoolean);
  }
  if (parameter.type === "integer_array" || parameter.type === "byte_array") {
    return values.map((value) => parseNumber(value, true));
  }
  if (parameter.type === "double_array") {
    return values.map((value) => parseNumber(value, false));
  }
  if (parameter.type === "string_array") {
    return values;
  }
  return null;
}

function isDirty(parameter: CameraParameter, draftValue: DraftValue | undefined) {
  if (draftValue === undefined) {
    return false;
  }
  return JSON.stringify(toDraftValue(parameter)) !== JSON.stringify(draftValue);
}

export const CameraSettingsContainer = () => {
  const { parameters, isLoading, error, refresh, setParameter } = useCamera();
  const [draftValues, setDraftValues] = useState<Record<string, DraftValue>>({});
  const [savingParameter, setSavingParameter] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sortedParameters = useMemo(() => {
    return [...parameters].sort((left, right) => {
      const leftIndex = PARAMETER_PRIORITY.indexOf(left.name);
      const rightIndex = PARAMETER_PRIORITY.indexOf(right.name);
      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
          (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
      }
      return left.name.localeCompare(right.name);
    });
  }, [parameters]);

  useEffect(() => {
    setDraftValues(
      Object.fromEntries(parameters.map((parameter) => [parameter.name, toDraftValue(parameter)]))
    );
  }, [parameters]);

  const updateDraft = (name: string, value: DraftValue) => {
    setSaveSuccess(null);
    setSaveError(null);
    setDraftValues((current) => ({ ...current, [name]: value }));
  };

  const saveParameter = async (parameter: CameraParameter, draftOverride?: DraftValue) => {
    setSavingParameter(parameter.name);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const value = toParameterValue(parameter, draftOverride ?? draftValues[parameter.name]);
      const result = await setParameter(parameter.name, value);
      if (result.success) {
        setSaveSuccess(`${labelForParameter(parameter.name)} updated.`);
      } else {
        setSaveError(result.message);
      }
    } catch (ex) {
      setSaveError(ex instanceof Error ? ex.message : "Invalid camera parameter value.");
    }
    setSavingParameter(null);
  };

  const renderControl = (parameter: CameraParameter) => {
    const draftValue = draftValues[parameter.name] ?? toDraftValue(parameter);
    if (parameter.type === "boolean") {
      return (
        <Toggle
          checked={draftValue === true}
          disabled={savingParameter === parameter.name}
          onChange={({ detail }) => {
            updateDraft(parameter.name, detail.checked);
            saveParameter(parameter, detail.checked);
          }}
        >
          {draftValue === true ? "Enabled" : "Disabled"}
        </Toggle>
      );
    }

    if (hasNumericRange(parameter)) {
      const min = parameter.min;
      const max = parameter.max;
      return (
        <Slider
          value={Number(draftValue)}
          min={min}
          max={max}
          step={parameter.step || (parameter.type === "integer" ? 1 : 0.1)}
          valueFormatter={(value) => String(value)}
          disabled={savingParameter === parameter.name}
          onChange={({ detail }) => updateDraft(parameter.name, detail.value)}
        />
      );
    }

    if (ARRAY_TYPES.includes(parameter.type)) {
      const values = Array.isArray(draftValue) ? draftValue : [];
      return (
        <SpaceBetween size="xs">
          <ColumnLayout columns={Math.min(Math.max(values.length, 1), 3)}>
            {values.map((value, index) => (
              <Input
                key={`${parameter.name}-${index}`}
                value={value}
                disabled={savingParameter === parameter.name}
                ariaLabel={`${labelForParameter(parameter.name)} value ${index + 1}`}
                onChange={({ detail }) => {
                  const nextValues = [...values];
                  nextValues[index] = detail.value;
                  updateDraft(parameter.name, nextValues);
                }}
              />
            ))}
          </ColumnLayout>
          {values.length === 0 && <Box color="text-status-inactive">No values reported.</Box>}
        </SpaceBetween>
      );
    }

    return (
      <Input
        value={String(draftValue)}
        disabled={savingParameter === parameter.name}
        onChange={({ detail }) => updateDraft(parameter.name, detail.value)}
      />
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={<Button onClick={() => refresh()} loading={isLoading}>Refresh</Button>}
          description="Live libcamera controls exposed by the active camera node."
        >
          Camera Controls
        </Header>
      }
    >
      <SpaceBetween size="m">
        {error && <Alert type="error">{error}</Alert>}
        {saveSuccess && (
          <Alert type="success" dismissible onDismiss={() => setSaveSuccess(null)}>
            {saveSuccess}
          </Alert>
        )}
        {saveError && (
          <Alert type="error" dismissible onDismiss={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {isLoading ? (
          <Box textAlign="center" padding="l">
            <Spinner size="large" />
          </Box>
        ) : sortedParameters.length === 0 ? (
          <Alert type="info">No editable camera controls are currently exposed.</Alert>
        ) : (
          <SpaceBetween size="l">
            {sortedParameters.map((parameter) => {
              const dirty = isDirty(parameter, draftValues[parameter.name]);
              return (
                <FormField
                  key={parameter.name}
                  label={labelForParameter(parameter.name)}
                  description={parameter.description || parameter.name}
                >
                  <SpaceBetween size="xs">
                    {renderControl(parameter)}
                    {parameter.type !== "boolean" && (
                      <Box float="right">
                        <Button
                          loading={savingParameter === parameter.name}
                          disabled={!dirty || savingParameter !== null}
                          onClick={() => saveParameter(parameter)}
                        >
                          Apply
                        </Button>
                      </Box>
                    )}
                  </SpaceBetween>
                </FormField>
              );
            })}
          </SpaceBetween>
        )}
      </SpaceBetween>
    </Container>
  );
};