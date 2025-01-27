// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';
import { ComponentMetrics, PerformanceMetrics } from '../../analytics';
import { useFunnel } from '../../analytics/hooks/use-funnel';
import { useDOMAttribute } from '../use-dom-attribute';
import { useEffectOnUpdate } from '../use-effect-on-update';
import { useRandomId } from '../use-unique-id';
/*
If the last user interaction is more than this time ago, it is not considered
to be the cause of the current loading state.
*/
const USER_ACTION_TIME_LIMIT = 1000;
export function useTableInteractionMetrics({ elementRef, itemCount, instanceIdentifier, getComponentIdentifier, getComponentConfiguration, loading = false, interactionMetadata, }) {
    const taskInteractionId = useRandomId();
    const tableInteractionAttributes = useDOMAttribute(elementRef, 'data-analytics-task-interaction-id', taskInteractionId);
    const { isInFunnel } = useFunnel();
    const lastUserAction = useRef(null);
    const capturedUserAction = useRef(null);
    const loadingStartTime = useRef(null);
    const metadata = useRef({ itemCount, getComponentIdentifier, getComponentConfiguration, interactionMetadata });
    metadata.current = { itemCount, getComponentIdentifier, getComponentConfiguration, interactionMetadata };
    useEffect(() => {
        if (isInFunnel) {
            return;
        }
        ComponentMetrics.componentMounted({
            taskInteractionId,
            componentName: 'table',
            componentConfiguration: metadata.current.getComponentConfiguration(),
        });
    }, [taskInteractionId, isInFunnel]);
    useEffect(() => {
        if (loading) {
            loadingStartTime.current = performance.now();
            if (lastUserAction.current && lastUserAction.current.time > performance.now() - USER_ACTION_TIME_LIMIT) {
                capturedUserAction.current = lastUserAction.current.name;
            }
            else {
                capturedUserAction.current = null;
            }
        }
    }, [loading]);
    useEffectOnUpdate(() => {
        var _a, _b;
        if (!loading && loadingStartTime.current !== null) {
            const loadingDuration = performance.now() - loadingStartTime.current;
            loadingStartTime.current = null;
            PerformanceMetrics.tableInteraction({
                userAction: (_a = capturedUserAction.current) !== null && _a !== void 0 ? _a : '',
                interactionTime: Math.round(loadingDuration),
                interactionMetadata: metadata.current.interactionMetadata(),
                componentIdentifier: metadata.current.getComponentIdentifier(),
                instanceIdentifier,
                noOfResourcesInTable: metadata.current.itemCount,
            });
            if (!isInFunnel) {
                ComponentMetrics.componentUpdated({
                    taskInteractionId,
                    componentName: 'table',
                    actionType: (_b = capturedUserAction.current) !== null && _b !== void 0 ? _b : '',
                    componentConfiguration: metadata.current.getComponentConfiguration(),
                });
            }
        }
    }, [instanceIdentifier, loading, taskInteractionId, isInFunnel]);
    return {
        tableInteractionAttributes,
        setLastUserAction: (name) => void (lastUserAction.current = { name, time: performance.now() }),
    };
}
//# sourceMappingURL=index.js.map