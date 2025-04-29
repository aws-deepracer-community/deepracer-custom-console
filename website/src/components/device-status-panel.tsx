import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  SplitPanel,
  StatusIndicator,
  SpaceBetween,
  FlashbarProps,
  Grid,
} from "@cloudscape-design/components";
import { ApiHelper } from "../common/helpers/api-helper";

interface DeviceStatusProps {
  isInferenceRunning: boolean;
  notifications?: FlashbarProps.MessageDefinition[];
  setNotifications: React.Dispatch<React.SetStateAction<FlashbarProps.MessageDefinition[]>>;
}

interface DeviceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  temperature: number;
  cpuFreq: number;
  cpuFreqMax: number;
  latencyMean: number;
  latencyP95: number;
  fpsMean: number;
}

interface DeviceStatusResponse {
  success: boolean;
  cpu_percent: number;
  memory_usage: number;
  free_disk: number;
  cpu_temp: number;
  cpu_freq: number;
  cpu_freq_max: number;
  latency_mean: number;
  latency_p95: number;
  fps_mean: number;
}

const DeviceStatusPanel = ({ isInferenceRunning, setNotifications }: DeviceStatusProps) => {
  // Define comparison types
  type ComparisonOperator = "gt" | "lt" | "gte" | "lte" | "eq";

  // Create a function that returns a comparator based on the operator string
  const getComparator = useCallback((op: ComparisonOperator) => {
    switch (op) {
      case "gt":
        return (a: number, b: number) => a > b;
      case "lt":
        return (a: number, b: number) => a < b;
      case "gte":
        return (a: number, b: number) => a >= b;
      case "lte":
        return (a: number, b: number) => a <= b;
      case "eq":
        return (a: number, b: number) => a === b;
      default:
        return (a: number, b: number) => a > b; // Default to greater than
    }
  }, []);

  // Define thresholds for different metrics, wrapped in useMemo to maintain reference equality
  const thresholds = useMemo(
    () => ({
      cpu: {
        usage: { warning: 90, error: 99, compare: "gt" as ComparisonOperator },
        temperature: { warning: 75, error: 90, compare: "gt" as ComparisonOperator },
        frequency: { warning: 85, error: 75, compare: "lt" as ComparisonOperator }, // Note: For CPU frequency, higher is better
      },
      memory: { warning: 85, error: 90, compare: "gt" as ComparisonOperator },
      disk: { warning: 90, error: 95, compare: "gt" as ComparisonOperator },
      performance: {
        latency_mean: { warning: 20.0, error: 30.0, compare: "gt" as ComparisonOperator },
        latency_p95: { warning: 1.35, error: 1.75, compare: "gt" as ComparisonOperator },
        fps_mean: { warning: 1.05, error: 1.1, compare: "gt" as ComparisonOperator },
      },
    }),
    []
  ); // Empty dependency array means this will only be calculated once

  const [metrics, setMetrics] = useState<DeviceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    temperature: 0,
    cpuFreq: 0,
    cpuFreqMax: 0,
    latencyMean: 0.0,
    latencyP95: 0.0,
    fpsMean: 0.0,
  });

  const [updatesSinceInferenceStarted, setUpdatesSinceInferenceStarted] = useState(0);

  const removeFlashMessage = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((message) => message.id !== id));
    },
    [setNotifications]
  );

  const addFlashMessage = useCallback(
    (id: string, content: string, type: FlashbarProps.Type, header?: string) => {
      // Check if a message with this ID already exists and update it if needed
      setNotifications((prev) => {
        const existingMessageIndex = prev.findIndex((message) => message.id === id);

        // Create the new/updated message
        const newMessage: FlashbarProps.MessageDefinition = {
          id,
          content,
          type,
          dismissible: type !== "in-progress",
          onDismiss: type !== "in-progress" ? () => removeFlashMessage(id) : undefined,
          ...(header && { header }),
        };

        // If message already exists, update it
        if (existingMessageIndex >= 0) {
          const updatedMessages = [...prev];
          updatedMessages[existingMessageIndex] = newMessage;
          return updatedMessages;
        }

        // Otherwise add a new message
        return [...prev, newMessage];
      });
      return id; // Return the id of the new/updated message
    },
    [removeFlashMessage, setNotifications]
  );

  useEffect(() => {
    if (!isInferenceRunning) {
      console.debug("Inference is not running, resetting updates since inference started.");
      setUpdatesSinceInferenceStarted(0);
    }
  }, [isInferenceRunning]);

  // Updated status check function using the dynamic comparator
  const checkStatus = useCallback(
    (
      value: number,
      thresholdConfig: { warning: number; error: number; compare: ComparisonOperator }
    ): "success" | "warning" | "error" => {
      const { warning, error, compare } = thresholdConfig;
      const comparator = getComparator(compare);

      if (!comparator(value, warning)) return "success";
      if (!comparator(value, error)) return "warning";
      return "error";
    },
    [getComparator]
  );

  const checkStatusWithInference = useCallback(
    (
      value: number,
      thresholdConfig: { warning: number; error: number; compare: ComparisonOperator },
      isInferenceRunning: boolean,
      updatesSinceInferenceStartedDelay: number,
      noInferenceStatus: "info" | "stopped" | "pending" = "stopped"
    ): "info" | "success" | "warning" | "error" | "stopped" | "pending" => {
      if (!isInferenceRunning) return noInferenceStatus;
      if (updatesSinceInferenceStarted <= updatesSinceInferenceStartedDelay) return "pending";
      return checkStatus(value, thresholdConfig);
    },
    [checkStatus, updatesSinceInferenceStarted]
  );

  const statusMinMax = (
    status1: "info" | "success" | "warning" | "error" | "stopped" | "pending",
    status2: "info" | "success" | "warning" | "error" | "stopped" | "pending",
    operator: "min" | "max"
  ): "info" | "success" | "warning" | "error" | "stopped" | "pending" => {
    const statusPriority = {
      error: 4,
      warning: 3,
      success: 2,
      info: 1,
      stopped: 0,
      pending: -1,
    };

    if (operator === "min") {
      return statusPriority[status1 as keyof typeof statusPriority] <
        statusPriority[status2 as keyof typeof statusPriority]
        ? status1
        : status2;
    } else {
      return statusPriority[status1 as keyof typeof statusPriority] >
        statusPriority[status2 as keyof typeof statusPriority]
        ? status1
        : status2;
    }
  };

  const allAlerts = useMemo(
    () => ({
      system: {
        "device-status-memory-usage": {
          metricValue: metrics.memoryUsage,
          status: checkStatus(metrics.memoryUsage, thresholds.memory),
          warningMessage: "Memory Usage is high",
          errorMessage: "Memory Usage is extremely high",
        },
        "device-status-disk-usage": {
          metricValue: metrics.diskUsage,
          status: checkStatus(metrics.diskUsage, thresholds.disk),
          warningMessage: "Disk Usage is high",
          errorMessage: "Disk Usage is extremely high",
        },
        "device-status-cpu-freq": {
          metricValue: (metrics.cpuFreq / metrics.cpuFreqMax) * 100.0,
          status: checkStatusWithInference(
            (metrics.cpuFreq / metrics.cpuFreqMax) * 100.0,
            thresholds.cpu.frequency,
            isInferenceRunning,
            3,
            "info"
          ),
          warningMessage: "CPU Frequency is low",
          errorMessage: "CPU Frequency is critically low",
          noInferenceStatus: "info" as "info" | "stopped" | "pending",
        },
      },
      performance: {
        "device-status-cpu-temp": {
          metricValue: metrics.temperature,
          status: checkStatus(metrics.temperature, thresholds.cpu.temperature),
          warningMessage: "CPU Temperature is high",
          errorMessage: "CPU Temperature is extremely high",
        },
        "device-status-cpu-usage": {
          metricValue: metrics.cpuUsage,
          status: checkStatusWithInference(
            metrics.cpuUsage,
            thresholds.cpu.usage,
            isInferenceRunning,
            3,
            "info"
          ),
          warningMessage: "CPU Usage is high",
          errorMessage: "CPU Usage is extremely high",
        },
        "device-status-latency": {
          metricValue: metrics.latencyMean,
          status: checkStatusWithInference(
            metrics.latencyMean,
            thresholds.performance.latency_mean,
            isInferenceRunning,
            3,
            "stopped"
          ),
          warningMessage: "Latency is high",
          errorMessage: "Latency is critically high",
          noInferenceStatus: "stopped" as "info" | "stopped" | "pending",
        },
        "device-status-latency-p95": {
          metricValue: metrics.latencyP95 / metrics.latencyMean,
          status: statusMinMax(
            checkStatusWithInference(
              metrics.latencyP95 / metrics.latencyMean,
              thresholds.performance.latency_p95,
              isInferenceRunning,
              3,
              "stopped"
            ),
            checkStatusWithInference(
              metrics.latencyP95,
              thresholds.performance.latency_mean,
              isInferenceRunning,
              3,
              "stopped"
            ),
            "min"
          ),
          warningMessage: "Latency (95th percentile) is high",
          errorMessage: "Latency (95th percentile) is critically high",
          noInferenceStatus: "stopped" as "info" | "stopped" | "pending",
        },
        "device-status-fps-mean": {
          metricValue: 30.0 / metrics.fpsMean,
          status: checkStatusWithInference(
            30.0 / metrics.fpsMean,
            thresholds.performance.fps_mean,
            isInferenceRunning,
            3,
            "stopped"
          ),
          warningMessage: "Frame Rate is low",
          errorMessage: "Frame Rate is critically low",
          noInferenceStatus: "stopped" as "info" | "stopped" | "pending",
        },
      },
    }),
    [metrics, thresholds, checkStatus, checkStatusWithInference, isInferenceRunning]
  );

  // Get combined performance metrics status and message
  const performanceMetricsAlert = useMemo(() => {
    const performanceAlerts = Object.values(allAlerts.performance);

    // Get the worst status (error > warning > success/info/stopped/pending)
    const getStatusPriority = (status: string): number => {
      switch (status) {
        case "error":
          return 2;
        case "warning":
          return 1;
        default:
          return 0; // info, success, stopped, pending
      }
    };

    const worstStatus = performanceAlerts
      .map((alert) => alert.status)
      .reduce(
        (worst, current) =>
          getStatusPriority(current) > getStatusPriority(worst) ? current : worst,
        "success" as string
      );

    // Build a combined message including both warnings and errors
    const errorMessages = performanceAlerts
      .filter((alert) => alert.status === "error")
      .map((alert) => alert.errorMessage);

    const warningMessages = performanceAlerts
      .filter((alert) => alert.status === "warning")
      .map((alert) => alert.warningMessage);

    const messages = [...errorMessages, ...warningMessages];

    return {
      status: worstStatus,
      message: messages.join(". ") + ".",
      hasIssue: worstStatus === "warning" || worstStatus === "error",
    };
  }, [allAlerts.performance]);

  // Separate effects for handling warning and error messages based on metrics
  useEffect(() => {
    Object.entries(allAlerts.system).forEach(([alertId, data]) => {
      if (data.status === "error") {
        addFlashMessage(alertId, data.errorMessage, "error");
      } else if (data.status === "warning") {
        addFlashMessage(alertId, data.warningMessage, "warning");
      } else {
        removeFlashMessage(alertId);
      }
    });
  }, [addFlashMessage, removeFlashMessage, allAlerts.system]);

  useEffect(() => {
    // Handle combined performance metrics alert
    const performanceAlertId = "device-status-performance";
    if (performanceMetricsAlert.hasIssue) {
      addFlashMessage(
        performanceAlertId,
        performanceMetricsAlert.message,
        performanceMetricsAlert.status as FlashbarProps.Type,
        "Potential Performance Issue"
      );
    } else {
      // For performance messages, convert to info with last contents as reference
      setNotifications((prev) => {
        const existingMessageIndex = prev.findIndex((message) => message.id === performanceAlertId);
        if (existingMessageIndex >= 0) {
          const existingMessage = prev[existingMessageIndex];
          if (existingMessage.type === "info") {
            return prev; // If the status is already "info", do nothing
          }
          const lastContent = existingMessage.content;
          const updatedMessages = [...prev];
          updatedMessages[existingMessageIndex] = {
            ...existingMessage,
            type: "info",
            content: `Last Error: ${lastContent}`,
            header: "Performance issue resolved",
          };
          return updatedMessages;
        }
        return prev;
      });
    }
  }, [addFlashMessage, removeFlashMessage, performanceMetricsAlert, setNotifications]);

  // Count updates since inference started
  useEffect(() => {
    if (isInferenceRunning) {
      setUpdatesSinceInferenceStarted((prev) => prev + 1);
    }
  }, [metrics, isInferenceRunning]);

  // Use API Helper to fetch real device status
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        const response = await ApiHelper.get<DeviceStatusResponse>("get_device_status");

        if (response?.success) {
          setMetrics({
            cpuUsage: parseFloat(response.cpu_percent.toFixed(0)),
            memoryUsage: parseFloat(response.memory_usage.toFixed(1)),
            diskUsage: parseFloat((100 - response.free_disk).toFixed(1)),
            temperature: parseFloat(response.cpu_temp.toFixed(1)),
            cpuFreq: parseFloat(response.cpu_freq.toFixed(0)),
            cpuFreqMax: parseFloat(response.cpu_freq_max.toFixed(0)),
            latencyMean: parseFloat(response.latency_mean.toFixed(1)),
            latencyP95: parseFloat(response.latency_p95.toFixed(1)),
            fpsMean: parseFloat(response.fps_mean.toFixed(1)),
          });
        }
      } catch (error) {
        console.error("Error fetching device status:", error);
      }
    };

    fetchDeviceStatus(); // Initial fetch
    const intervalId = setInterval(fetchDeviceStatus, 4000);

    return () => clearInterval(intervalId);
  }, []); // Remove updatesSinceInferenceStarted from dependency array

  return (
    <SplitPanel header={"Car Health"} hidePreferencesButton={true} closeBehavior="collapse">
      <SpaceBetween size="xs" direction="vertical">
        <Grid
          gridDefinition={[
            { colspan: { default: 12, xxs: 12, xs: 4 } },
            { colspan: { default: 6, xxs: 6, xs: 4 } },
            { colspan: { default: 6, xxs: 6, xs: 4 } },
          ]}
        >
          {/* CPU Metrics */}
          <SpaceBetween size="xxs" direction="vertical">
            <Box variant="h4">CPU</Box>
            <div style={{ display: "grid", gridTemplateColumns: "100px auto", rowGap: "6px" }}>
              <Box>Usage:</Box>
              <StatusIndicator type={allAlerts.performance["device-status-cpu-usage"].status}>
                {metrics.cpuUsage}%
              </StatusIndicator>

              <Box>Temperature:</Box>
              <StatusIndicator type={allAlerts.performance["device-status-cpu-temp"].status}>
                {metrics.temperature}°C
              </StatusIndicator>

              <Box>Frequency:</Box>
              <StatusIndicator type={allAlerts.system["device-status-cpu-freq"].status}>
                {metrics.cpuFreq} MHz / {metrics.cpuFreqMax} MHz
              </StatusIndicator>
            </div>
          </SpaceBetween>

          {/* Memory & Disk Usage */}
          <SpaceBetween size="xxs" direction="vertical">
            <Box variant="h4">Memory Usage</Box>
            <div style={{ display: "grid", gridTemplateColumns: "100px auto", rowGap: "6px" }}>
              <Box>RAM:</Box>
              <StatusIndicator type={allAlerts.system["device-status-memory-usage"].status}>
                {metrics.memoryUsage}%
              </StatusIndicator>

              <Box>Disk:</Box>
              <StatusIndicator type={allAlerts.system["device-status-disk-usage"].status}>
                {metrics.diskUsage}%
              </StatusIndicator>
            </div>
          </SpaceBetween>

          {/* FPS & Latency */}
          <SpaceBetween size="xxs" direction="vertical">
            <Box variant="h4">Performance</Box>
            <div style={{ display: "grid", gridTemplateColumns: "100px auto", rowGap: "6px" }}>
              <Box>Mean Latency:</Box>
              <StatusIndicator type={allAlerts.performance["device-status-latency"].status}>
                {metrics.latencyMean.toFixed(1)} ms
              </StatusIndicator>
              <Box>95% Latency:</Box>
              <StatusIndicator type={allAlerts.performance["device-status-latency-p95"].status}>
                {metrics.latencyP95.toFixed(1)} ms
              </StatusIndicator>
              <Box>Frame Rate:</Box>
              <StatusIndicator type={allAlerts.performance["device-status-fps-mean"].status}>
                {metrics.fpsMean.toFixed(1)} fps
              </StatusIndicator>
            </div>
          </SpaceBetween>
        </Grid>
      </SpaceBetween>
    </SplitPanel>
  );
};

export default DeviceStatusPanel;
