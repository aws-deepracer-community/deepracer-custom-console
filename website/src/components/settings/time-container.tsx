import { useEffect, useState } from "react";
import {
  Alert,
  Container,
  Header,
  SpaceBetween,
  Button,
  KeyValuePairs,
  StatusIndicator,
} from "@cloudscape-design/components";
import { ApiHelper } from "../../common/helpers/api-helper";

interface TimeResponse {
  success: boolean;
  reason?: number;
  time?: string;
  timezone?: string;
  timezone_abbr?: string;
  utc_offset?: string;
  timezone_changed?: boolean;
}

export const TimeContainer = () => {
  const [timeData, setTimeData] = useState({
    time: "Unknown",
    timezone: "Unknown",
    timezone_abbr: "",
    utc_offset: "",
    timezone_changed: false,
  });
  const [timezoneChanging, setTimezoneChanging] = useState(false);
  const [timezoneChangeSuccess, setTimezoneChangeSuccess] = useState(false);
  const [timezoneChangeError, setTimezoneChangeError] = useState(false);

  const fetchTimeData = async () => {
    const data = await ApiHelper.get<TimeResponse>("get_time");
    if (data?.success) {
      setTimeData({
        time: data.time || "Unknown",
        timezone: data.timezone || "Unknown",
        timezone_abbr: data.timezone_abbr || "",
        utc_offset: data.utc_offset || "",
        timezone_changed: data.timezone_changed || false,
      });
    }
  };

  const getBrowserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const setBrowserTimezone = async () => {
    const browserTimezone = getBrowserTimezone();
    setTimezoneChanging(true);
    setTimezoneChangeError(false);

    const response = await ApiHelper.post<{ success: boolean }>("set_timezone", {
      timezone: browserTimezone,
    });

    if (response?.success) {
      setTimezoneChanging(false);
      setTimezoneChangeSuccess(true);
      await fetchTimeData(); // Refresh time data
      setTimeout(() => setTimezoneChangeSuccess(false), 3000);
    } else {
      setTimezoneChanging(false);
      setTimezoneChangeError(true);
      setTimeout(() => setTimezoneChangeError(false), 3000);
    }
  };

  useEffect(() => {
    fetchTimeData();
    // Refresh time every 30 seconds
    const interval = setInterval(fetchTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container
      header={
        <Header
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => fetchTimeData()}>Refresh</Button>
              <Button
                loading={timezoneChanging}
                onClick={() => setBrowserTimezone()}
                disabled={
                  timezoneChanging ||
                  timeData.timezone_changed ||
                  timeData.timezone === getBrowserTimezone()
                }
              >
                Set to Browser Timezone
              </Button>
            </SpaceBetween>
          }
          description="Current time and timezone settings for the AWS DeepRacer vehicle."
        >
          Time & Timezone
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="m">
        {!timeData.timezone_changed ? (
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: "Current Car Time",
                value:
                  timeData.time === "Unknown" ? (
                    <StatusIndicator type="warning">Unknown</StatusIndicator>
                  ) : (
                    timeData.time
                  ),
              },
              {
                label: "Car Timezone",
                value:
                  timeData.timezone === "Unknown" ? (
                    <StatusIndicator type="warning">Unknown</StatusIndicator>
                  ) : (
                    <>
                      {timeData.timezone}
                      {timeData.timezone_abbr ? ` (${timeData.timezone_abbr}` : "("}
                      {timeData.utc_offset ? `, ${timeData.utc_offset})` : ")"}
                    </>
                  ),
              },
              {
                label: "Browser Timezone",
                value: getBrowserTimezone(),
              },
            ]}
          />
        ) : !timezoneChangeSuccess ? (
          <Alert type="info">Timezone changed. Reset DeepRacer for changes to take effect.</Alert>
        ) : null}
        {timezoneChangeSuccess && (
          <Alert onDismiss={() => setTimezoneChangeSuccess(false)} dismissible type="success">
            Timezone was updated successfully to {getBrowserTimezone()}.
          </Alert>
        )}

        {timezoneChangeError && (
          <Alert onDismiss={() => setTimezoneChangeError(false)} dismissible type="error">
            Failed to update timezone. Please try again.
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
};
