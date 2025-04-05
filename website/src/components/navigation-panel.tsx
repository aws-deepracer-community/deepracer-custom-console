import { SideNavigation, SideNavigationProps, SpaceBetween } from "@cloudscape-design/components";
import Button from "@cloudscape-design/components/button";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "../common/constants";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { useOnFollow } from "../common/hooks/use-on-follow";
import { ApiHelper } from "../common/helpers/api-helper";
import { useNetwork } from "../common/hooks/use-network";
import { useSupportedApis } from "../common/hooks/use-supported-apis";

interface BatteryProps {
  battery: {
    level: number;
    error: boolean;
    hasInitialReading: boolean;
  };
}

interface DriveResponse {
  success: boolean;
}

export default function NavigationPanel({ battery }: BatteryProps) {
  const location = useLocation();
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  const navigate = useNavigate();
  const { ssid, ipAddresses } = useNetwork();
  const { isEmergencyStopSupported } = useSupportedApis();
  const [pageLoadTime] = useState<number>(Date.now());
  const hasBeenTenSeconds = Date.now() - pageLoadTime >= 10000;

  const handleLogout = async () => {
    navigate("/logout");
  };

  const handleEmergencyStop = async () => {
    try {
      await ApiHelper.post<DriveResponse>("start_stop", {
        start_stop: "stop",
      })
        .then((response) => {
          console.log("Vehicle stopped:", response);
          // Now call emergency_stop after start_stop completes successfully
          return ApiHelper.post<DriveResponse>("emergency_stop", {});
        })
        .catch((error) => {
          console.error("Error stopping vehicle:", error);
          // Still try emergency stop even if start_stop fails
          return ApiHelper.post<DriveResponse>("emergency_stop", {});
        })
        .catch((error) => {
          console.error("Error in emergency stop:", error);
        });
    } catch (error) {
      console.error("Error stopping vehicle:", error);
    }
  };

  const [items] = useState<SideNavigationProps.Item[]>(() => {
    const items: SideNavigationProps.Item[] = [
      {
        type: "link",
        text: "Control Vehicle",
        href: "/home",
      },
      {
        type: "link",
        text: "Models",
        href: "/models",
      },
      {
        type: "link",
        text: "Calibration",
        href: "/calibration",
      },
      {
        type: "link",
        text: "Settings",
        href: "/settings",
      },
      {
        type: "link",
        text: "Logs",
        href: "/logs",
      },
    ];

    items.push(
      { type: "divider" },
      {
        type: "link",
        text: "Build a track",
        href: "https://docs.aws.amazon.com/console/deepracer/build-track",
        external: true,
      },
      {
        type: "link",
        text: "Train a model",
        href: "https://docs.aws.amazon.com/console/deepracer/train-model",
        external: true,
      },
      { type: "divider" }
    );
    return items;
  });

  const onChange = ({ detail }: { detail: SideNavigationProps.ChangeDetail }) => {
    const sectionIndex = items.indexOf(detail.item);
    setNavigationPanelState({
      collapsedSections: {
        ...navigationPanelState.collapsedSections,
        [sectionIndex]: !detail.expanded,
      },
    });
  };

  return (
    <>
      <SpaceBetween size="xxs" direction="vertical">
        <SideNavigation
          onFollow={onFollow}
          onChange={onChange}
          header={{ href: "/", text: APP_NAME }}
          activeHref={location.pathname}
          items={items.map((value, idx) => {
            if (value.type === "section") {
              const collapsed = navigationPanelState.collapsedSections?.[idx] === true;
              value.defaultExpanded = !collapsed;
            }
            return value;
          })}
        />
        <div style={{ marginLeft: "25px", marginTop: "-20px" }}>
          <SpaceBetween size="l" direction="vertical">
            <KeyValuePairs
              items={[
                { label: "SSID", value: ssid || "Not connected" },
                {
                  label: "IP Addresses",
                  value: ipAddresses.length > 0 ? ipAddresses.join(", ") : "No IP address",
                },
                {
                  label: "Battery Status",
                  value: (
                    <ProgressBar
                      value={battery.level}
                      description="Current Battery Charge"
                      status={
                        (!battery.hasInitialReading && hasBeenTenSeconds) || battery.error
                          ? "error"
                          : "in-progress"
                      }
                      additionalInfo={
                        !battery.hasInitialReading && hasBeenTenSeconds
                          ? "Unable to get battery reading"
                          : battery.error
                          ? "Vehicle battery is not connected"
                          : undefined
                      }
                    />
                  ),
                },
              ]}
            />
            <div style={{ marginRight: "20px", marginBottom: "20px" }}>
              <SpaceBetween size="s" direction="vertical">
                {isEmergencyStopSupported && (
                  <Button
                    variant="normal"
                    onClick={handleEmergencyStop}
                    data-testid="emergency-stop"
                    fullWidth={true}
                  >
                    Emergency Stop & Reset
                  </Button>
                )}
                <Button fullWidth={true} onClick={handleLogout}>
                  Logout{" "}
                </Button>
              </SpaceBetween>
            </div>
          </SpaceBetween>
        </div>
      </SpaceBetween>
    </>
  );
}
