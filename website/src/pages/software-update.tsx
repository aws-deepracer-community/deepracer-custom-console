import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  SpaceBetween,
  ProgressBar,
  StatusIndicator,
  Button,
  Box,
  Grid,
  Alert,
} from "@cloudscape-design/components";
import { ApiHelper } from "../common/helpers/api-helper";
import { ServerReadyResponse } from "../common/types";

export const SoftwareUpdatePage = () => {
  const [updateStatus, setUpdateStatus] = useState<string>("unknown");
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const SERVER_CHECK_DELAY_MS = 15000; // 15 seconds delay before checking server readiness

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const startUpdateMonitoring = () => {
      eventSource = new EventSource("/api/update_status");

      eventSource.onmessage = (event) => {
        try {
          const data = event.data;
          // Parse the data format: "status:downloading|update_pct:50 1"
          const statusMatch = data.match(/status:([^|]+)/);
          const pctMatch = data.match(/update_pct:(\d+)/);

          if (statusMatch && pctMatch) {
            const status = statusMatch[1];
            const percentage = parseInt(pctMatch[1], 10);

            setUpdateStatus(status);
            setUpdateProgress(percentage);

            // If update is complete, start checking for server
            if (status === "complete" || percentage >= 100) {
              eventSource?.close();
              // Set status to indicate rebooting phase
              setUpdateStatus("rebooting");
              setUpdateProgress(100);
              startServerCheck();
            }
          }
        } catch (err) {
          console.error("Error parsing update status:", err);
          setError("Error monitoring update progress");
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource error:", event);
        setError("Lost connection to update service");
        eventSource?.close();
      };
    };

    const startServerCheck = () => {
      // Wait 15 seconds before starting to check for server ready (reboot happens after 10 seconds)
      setTimeout(() => {
        const checkServerReady = async () => {
          try {
            const response = await ApiHelper.get<ServerReadyResponse>("server_ready");
            if (response?.success && response.status) {
              // Server is ready, update status to complete
              setUpdateStatus("complete");
              // Short delay to show success message, then redirect
              setTimeout(() => {
                navigate("/");
              }, 2000);
            } else {
              // Server responded but not ready yet, schedule next check
              console.log("Server responded but not ready yet, continuing to check...");
              setTimeout(checkServerReady, 2000);
            }
          } catch (err) {
            // Server not ready yet, schedule next check
            console.log("Server not ready yet, continuing to check...");
            setTimeout(checkServerReady, 2000);
          }
        };

        checkServerReady();
      }, SERVER_CHECK_DELAY_MS); // Wait 15 seconds before starting checks
    };

    startUpdateMonitoring();

    return () => {
      eventSource?.close();
    };
  }, [navigate]);

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case "unknown":
        return "Checking update status...";
      case "checking":
        return "Checking for software updates...";
      case "beginning":
        return "Initializing software update...";
      case "downloading":
        return "Downloading update package...";
      case "installing":
        return "Installing software update...";
      case "complete":
        return "Software update completed successfully!";
      case "rebooting":
        return "System is rebooting...";
      default:
        return "Processing update...";
    }
  };

  const getProgressStatus = (status: string) => {
    switch (status) {
      case "complete":
        return "success";
      case "unknown":
      case "checking":
      case "beginning":
      case "downloading":
      case "installing":
      case "rebooting":
        return "in-progress";
      default:
        return "in-progress";
    }
  };

  const handleReturnToSettings = () => {
    navigate("/settings", { replace: true });
  };

  return (
    <Box padding="l">
      <Grid
        gridDefinition={[
          {
            offset: { s: 2, m: 2, l: 3, xl: 4 },
            colspan: { default: 12, xxs: 12, xs: 12, s: 8, m: 8, l: 6, xl: 5 },
          },
        ]}
      >
        <Container>
          <SpaceBetween size="l">
            <Box textAlign="center">
              <img src="./static/AWS_logo_RGB.svg" width="100" alt="AWS Logo" />
            </Box>

            <Box variant="h1" textAlign="center">
              Software Update
            </Box>

            {updateStatus === "rebooting" ? (
              <Alert type="info">
                Update installation complete. System is rebooting. Please wait while the device
                comes back online...
              </Alert>
            ) : updateStatus === "complete" ? (
              <Alert type="success">
                Update completed successfully! Redirecting to home page...
              </Alert>
            ) : (
              <Alert type="warning">
                Please wait while your AWS DeepRacer software is being updated. Do not power off the
                device during this process.
              </Alert>
            )}

            {error ? (
              <SpaceBetween direction="vertical" size="m">
                <StatusIndicator type="error">{error}</StatusIndicator>
                <Box textAlign="center">
                  <Button onClick={handleReturnToSettings}>Return to Settings</Button>
                </Box>
              </SpaceBetween>
            ) : (
              <SpaceBetween direction="vertical" size="m">
                <ProgressBar
                  value={updateProgress}
                  additionalInfo={`${updateProgress}% complete`}
                  description={getStatusMessage(updateStatus)}
                  label="Software Update Progress"
                  status={getProgressStatus(updateStatus)}
                />
              </SpaceBetween>
            )}
          </SpaceBetween>
        </Container>
      </Grid>
    </Box>
  );
};
