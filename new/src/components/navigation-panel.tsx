import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import { useState } from "react";
import { useOnFollow } from "../common/hooks/use-on-follow";
import { APP_NAME } from "../common/constants";
import { useLocation } from "react-router-dom";
import Button from "@cloudscape-design/components/button";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NavigationPanel() {
  const location = useLocation();
  const onFollow = useOnFollow();
  const [navigationPanelState, setNavigationPanelState] =
    useNavigationPanelState();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await axios.get('/redirect_login');
      console.log('Vehicle Logged Out:', response.data);
    } catch (error) {
      console.error('Error logging out vehicle:', error);
    }
    navigate('/login');
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
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </>
  );
  
}
