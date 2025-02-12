import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { useState, useEffect } from "react";
import { useOnFollow } from "../common/hooks/use-on-follow";
import { APP_NAME } from "../common/constants";
import { useLocation } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProgressBar from "@cloudscape-design/components/progress-bar";

export default function NavigationPanel() {
  const location = useLocation();
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();
  const navigate = useNavigate();
  const [batteryLevel, setBatteryLevel] = useState<number>(0);
  const [batteryError, setBatteryError] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      const response = await axios.get('/redirect_login');
      console.log('Vehicle Logged Out:', response.data);
    } catch (error) {
      console.error('Error logging out vehicle:', error);
    }
    navigate('/login');
  };

  const updateBatteryStatus = async () => {
    const batteryData = await getBatteryStatus();
    if (batteryData && batteryData.success) {
      if (batteryData.battery_level === -1) {
        setBatteryError(true);
        setBatteryLevel(0);
      } else {
        setBatteryError(false);
        setBatteryLevel((batteryData.battery_level / 10) * 100);
      }
    }
  };

  const getBatteryStatus = async () => {
    try {
      const response = await axios.get('/api/get_battery_level');
      return response.data;
    } catch (error) {
      console.error('Error fetching battery status:', error);
      return null;
    }
  };

  const getNetworkStatus = async () => {
    try {
      const response = await axios.get('/api/get_network_details');
      return response.data;
    } catch (error) {
      console.error('Error fetching battery status:', error);
      return null;
    }
  };

  useEffect(() => {
    updateBatteryStatus();
    getNetworkStatus();
    const interval = setInterval(updateBatteryStatus, 10000);
    const network_interval = setInterval(getNetworkStatus, 10000);
    
    // Return a cleanup function that clears both intervals
    return () => {
        clearInterval(interval);
        clearInterval(network_interval);
    };
  }, []);

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
      { type: "divider" },
      {
        type: "link",
        text: "IP:",
        href: "https://",
        external: true,
      },
    );
    return items;
  });

  const onChange = ({
    detail,
  }: {
    detail: SideNavigationProps.ChangeDetail;
  }) => {
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
      <SideNavigation
        onFollow={onFollow}
        onChange={onChange}
        header={{ href: "/", text: APP_NAME }}
        activeHref={location.pathname}
        items={items.map((value, idx) => {
          if (value.type === "section") {
            const collapsed =
              navigationPanelState.collapsedSections?.[idx] === true;
            value.defaultExpanded = !collapsed;
          }
          return value;
        })}
      />
      <div style={{ marginLeft: "20px" }}>
        <ProgressBar
          value={batteryLevel}
          description="Current Battery Charge"
          label="Battery Status"
          status={batteryError ? "error" : "in-progress"}
          additionalInfo={
            batteryError ? "Vehicle battery is not connected" : undefined
          }
        />
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </>
  );
  
}
