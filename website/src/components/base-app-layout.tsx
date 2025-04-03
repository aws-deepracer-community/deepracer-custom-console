import { AppLayout, AppLayoutProps, Flashbar, FlashbarProps } from "@cloudscape-design/components";
import { useNavigationPanelState } from "../common/hooks/use-navigation-panel-state";
import NavigationPanel from "./navigation-panel";
import { useBattery } from "../common/hooks/use-battery";
import { useModels } from "../common/hooks/use-models";

interface BaseAppLayoutProps extends AppLayoutProps {
  additionalNotifications?: FlashbarProps.MessageDefinition[];
  showBatteryNotifications?: boolean;
  showModelNotifications?: boolean;
}

export default function BaseAppLayout(props: BaseAppLayoutProps) {
  const { 
    additionalNotifications = [], 
    showBatteryNotifications = true,
    showModelNotifications = true,
    ...restProps 
  } = props;
  
  const [navigationPanelState, setNavigationPanelState] = useNavigationPanelState();
  
  // Use the battery context
  const {
    batteryLevel,
    batteryError,
    hasInitialReading,
    batteryFlashbarItems
  } = useBattery();

  // Get model notifications from context
  const { modelFlashbarItems } = useModels();

  // Collect all notifications
  const allNotifications: FlashbarProps.MessageDefinition[] = [
    // Battery notifications
    ...(showBatteryNotifications ? batteryFlashbarItems : []),
    
    // Model notifications
    ...(showModelNotifications ? modelFlashbarItems : []),
    
    // Additional page-specific notifications
    ...additionalNotifications
  ];

  return (
    <AppLayout
      headerSelector="#awsui-top-navigation"
      navigation={<NavigationPanel battery={{ level: batteryLevel, error: batteryError, hasInitialReading: hasInitialReading }} />}
      navigationOpen={!navigationPanelState.collapsed}
      onNavigationChange={({ detail }) => setNavigationPanelState({ collapsed: !detail.open })}
      toolsHide={true}
      notifications={
        allNotifications.length > 0 ? <Flashbar items={allNotifications} /> : null
      }
      {...restProps}
    />
  );
}
