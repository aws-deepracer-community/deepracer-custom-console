// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useRef } from 'react';
import { createWidgetizedComponent } from '../../../internal/widgets';
import AppLayoutGlobalDrawer from './global-drawer';
export function AppLayoutGlobalDrawersImplementation({ appLayoutInternals, }) {
    const { globalDrawers, activeGlobalDrawersIds } = appLayoutInternals;
    const openDrawersHistory = useRef(new Set());
    if (!globalDrawers.length) {
        return React.createElement(React.Fragment, null);
    }
    return (React.createElement(React.Fragment, null, globalDrawers
        .filter(drawer => activeGlobalDrawersIds.includes(drawer.id) ||
        (drawer.preserveInactiveContent && openDrawersHistory.current.has(drawer.id)))
        .map(drawer => {
        openDrawersHistory.current.add(drawer.id);
        return (React.createElement(AppLayoutGlobalDrawer, { key: drawer.id, show: activeGlobalDrawersIds.includes(drawer.id), activeGlobalDrawer: drawer, appLayoutInternals: appLayoutInternals }));
    })));
}
export const createWidgetizedAppLayoutGlobalDrawers = createWidgetizedComponent(AppLayoutGlobalDrawersImplementation);
//# sourceMappingURL=global-drawers.js.map