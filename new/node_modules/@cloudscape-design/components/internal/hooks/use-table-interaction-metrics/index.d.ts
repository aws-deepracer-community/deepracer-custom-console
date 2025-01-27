/// <reference types="react" />
import { JSONObject } from '../../analytics/interfaces';
export interface UseTableInteractionMetricsProps {
    elementRef: React.RefObject<HTMLElement>;
    instanceIdentifier: string | undefined;
    loading: boolean | undefined;
    itemCount: number;
    getComponentIdentifier: () => string | undefined;
    getComponentConfiguration: () => JSONObject;
    interactionMetadata: () => string;
}
export declare function useTableInteractionMetrics({ elementRef, itemCount, instanceIdentifier, getComponentIdentifier, getComponentConfiguration, loading, interactionMetadata, }: UseTableInteractionMetricsProps): {
    tableInteractionAttributes: {
        [x: string]: string | undefined;
    };
    setLastUserAction: (name: string) => undefined;
};
//# sourceMappingURL=index.d.ts.map