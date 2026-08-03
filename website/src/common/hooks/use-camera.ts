import { useState, useEffect, useCallback } from "react";
import { ApiHelper } from "../../common/helpers/api-helper";
import {
  CameraParameter,
  CameraParametersResponse,
  CameraSetParameterResponse,
  CameraParameterValue,
} from "../../common/types";

export interface UseCameraReturn {
  parameters: CameraParameter[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setParameter: (
    name: string,
    value: CameraParameterValue
  ) => Promise<{ success: boolean; message?: string }>;
}

const API_PATH_PARAMS = "camera/params";
const API_PATH_PARAM = "camera/param/";

export function useCamera(): UseCameraReturn {
  const [parameters, setParameters] = useState<CameraParameter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParameters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ApiHelper.get<CameraParametersResponse>(API_PATH_PARAMS);
      if (response && response.status === "success" && response.params) {
        setParameters(response.params);
      } else if (response && response.status === "error") {
        setError(response.message || "Failed to fetch camera parameters.");
      } else {
        setError("Unexpected API response format.");
      }
    } catch (err) {
      setError("An error occurred while fetching camera parameters.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  const setParameter = async (
    name: string,
    value: CameraParameterValue
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await ApiHelper.post<CameraSetParameterResponse>(
        `${API_PATH_PARAM}${name}`,
        { value }
      );
      if (response && response.status === "success") {
        // Refresh parameters to ensure local state matches server/ROS 2 state
        await fetchParameters();
        return { success: true };
      } else if (response && response.status === "error") {
        const msg = response.message || `Failed to set parameter ${name}`;
        await fetchParameters();
        return { success: false, message: msg };
      } else {
        throw new Error("Unexpected API response status.");
      }
    } catch (err) {
      console.error(`Error setting parameter ${name}:`, err);
      // We don't necessarily want to trigger a global error state for just one failed parameter update,
      // but we might want to re-fetch to revert the UI if it was optimistic (though we aren't being optimistic here).
      await fetchParameters();
      if (err instanceof Error) {
        return { success: false, message: err.message };
      }
      return { success: false, message: "An error occurred while setting the parameter." };
    }
  };

  return {
    parameters,
    isLoading,
    error,
    refresh: fetchParameters,
    setParameter,
  };
}
