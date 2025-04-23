import { useState } from "react";
import { TopNavigation } from "@cloudscape-design/components";
import { Mode } from "@cloudscape-design/global-styles";
import { StorageHelper } from "../common/helpers/storage-helper";
import { APP_NAME } from "../common/constants";
import { useSupportedApis } from "../common/hooks/use-supported-apis";
import { usePreferences } from "../common/hooks/use-preferences";

export default function GlobalHeader() {
  const [theme, setTheme] = useState<Mode>(StorageHelper.getTheme());

  // Get API support information
  const { isDeviceStatusSupported } = useSupportedApis();

  // Use settings context instead of local state
  const { settings, setEnableSpeedAdjustment, setEnableDeviceStatus } = usePreferences();

  const onChangeThemeClick = () => {
    if (theme === Mode.Dark) {
      setTheme(StorageHelper.applyTheme(Mode.Light));
    } else {
      setTheme(StorageHelper.applyTheme(Mode.Dark));
    }
  };

  // Helper function to toggle settings
  const toggleSetting = (id: string) => {
    if (id === "speed-adjustment") {
      setEnableSpeedAdjustment(!settings.enableSpeedAdjustment);
    } else if (id === "device-status" && isDeviceStatusSupported) {
      // Only allow toggle if supported
      setEnableDeviceStatus(!settings.enableDeviceStatus);
    }
  };

  return (
    <div
      style={{ zIndex: 1002, top: 0, left: 0, right: 0, position: "fixed" }}
      id="awsui-top-navigation"
    >
      <TopNavigation
        identity={{
          title: "AWS DeepRacer",
          href: "/",
          logo: { src: "/static/images/deepracer.png", alt: `${APP_NAME} Logo` },
        }}
        utilities={[
          {
            type: "button",
            text: theme === Mode.Dark ? "Light Mode" : "Dark Mode",
            onClick: onChangeThemeClick,
          },
          {
            type: "menu-dropdown",
            iconName: "settings",
            items: [
              {
                id: "speed-adjustment",
                text:
                  (settings.enableSpeedAdjustment ? "Disable " : "Enable ") + "5x Speed Adjustment",
                iconName: "angle-right-double",
              },
              {
                id: "device-status",
                text: (settings.enableDeviceStatus ? "Disable " : "Enable ") + "Car Health Monitoring",
                iconName: "heart",
                disabled: !isDeviceStatusSupported,
                description: !isDeviceStatusSupported ? "Not supported on this device" : undefined,
              },
            ],
            onItemClick: (event) => {
              toggleSetting(event.detail.id);
            },
          },
        ]}
      />
    </div>
  );
}
