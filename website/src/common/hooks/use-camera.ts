import { useCallback, useEffect, useState } from "react";
import { ApiHelper } from "../helpers/api-helper";
import {
  CameraParameter,
  CameraParameterValue,
  CameraParametersResponse,
  CameraSetParameterResponse,
} from "../types";

export const useCamera = () => {
  const [parameters, setParameters] = useState<CameraParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await ApiHelper.get<CameraParametersResponse>("camera/params");
    if (response?.status === "success") {
      setParameters(response.params ?? []);
    } else {
      setParameters([]);
      setError(response?.message ?? "Unable to load camera parameters.");
    }
    setIsLoading(false);
  }, []);

  const setParameter = useCallback(async (name: string, value: CameraParameterValue) => {
    const response = await ApiHelper.post<CameraSetParameterResponse>(
      `camera/param/${encodeURIComponent(name)}`,
      { value }
    );
    if (response?.status === "success") {
      setParameters((current) =>
        current.map((parameter) =>
          parameter.name === name ? { ...parameter, value: response.new_value ?? value } : parameter
        )
      );
      return { success: true, message: null };
    }
    return {
      success: false,
      message: response?.message ?? `Unable to update ${name}.`,
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { parameters, isLoading, error, refresh, setParameter };
};