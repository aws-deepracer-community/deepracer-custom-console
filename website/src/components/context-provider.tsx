import React from "react";
import { BatteryContext, useBatteryProvider } from "../common/hooks/use-battery";
import { NetworkContext, useNetworkProvider } from "../common/hooks/use-network";
import { SupportedApisContext, useSupportedApisProvider } from "../common/hooks/use-supported-apis";
import { ModelsContext, useModelsProvider } from "../common/hooks/use-models";
import { AuthContext, useAuthProvider } from "../common/hooks/use-authentication";

// Main Context Provider Component
export const ContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const batteryContextValue = useBatteryProvider();
  const networkContextValue = useNetworkProvider();
  const supportedApisContextValue = useSupportedApisProvider();
  const modelsContextValue = useModelsProvider();

  return (
    <BatteryContext.Provider value={batteryContextValue}>
      <NetworkContext.Provider value={networkContextValue}>
        <SupportedApisContext.Provider value={supportedApisContextValue}>
          <ModelsContext.Provider value={modelsContextValue}>{children}</ModelsContext.Provider>
        </SupportedApisContext.Provider>
      </NetworkContext.Provider>
    </BatteryContext.Provider>
  );
};

// Auth Context Provider
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const authValues = useAuthProvider();

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
};
