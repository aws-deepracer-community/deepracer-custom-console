import React from "react";
import { BatteryContext, useBatteryProvider } from "../common/hooks/use-battery";
import { NetworkContext, useNetworkProvider } from "../common/hooks/use-network";
import { SupportedApisContext, useSupportedApisProvider } from "../common/hooks/use-supported-apis";
import { CarConfigContext, useCarConfigProvider } from "../common/hooks/use-car-config";
import { ModelsContext, useModelsProvider } from "../common/hooks/use-models";
import { AuthContext, useAuthProvider } from "../common/hooks/use-authentication";
import { PreferencesContext, usePreferencesProvider } from "../common/hooks/use-preferences";
import { ApiContext, useApiProvider } from "../common/hooks/use-api";

// Main Context Provider Component
export const ContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const batteryContextValue = useBatteryProvider();
  const networkContextValue = useNetworkProvider();
  const supportedApisContextValue = useSupportedApisProvider();
  const modelsContextValue = useModelsProvider();
  const preferencesContextValue = usePreferencesProvider();

  return (
    <SupportedApisContext.Provider value={supportedApisContextValue}>
      <CarConfigInnerProvider>
        <PreferencesContext.Provider value={preferencesContextValue}>
          <BatteryContext.Provider value={batteryContextValue}>
            <NetworkContext.Provider value={networkContextValue}>
              <ModelsContext.Provider value={modelsContextValue}>{children}</ModelsContext.Provider>
            </NetworkContext.Provider>
          </BatteryContext.Provider>
        </PreferencesContext.Provider>
      </CarConfigInnerProvider>
    </SupportedApisContext.Provider>
  );
};

// Inner provider that can consume SupportedApisContext
const CarConfigInnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const carConfigContextValue = useCarConfigProvider();
  return (
    <CarConfigContext.Provider value={carConfigContextValue}>{children}</CarConfigContext.Provider>
  );
};

export const ApiProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const apiValues = useApiProvider();

  return <ApiContext.Provider value={apiValues}>{children}</ApiContext.Provider>;
};

// Auth Context Provider
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const authValues = useAuthProvider();

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
};
