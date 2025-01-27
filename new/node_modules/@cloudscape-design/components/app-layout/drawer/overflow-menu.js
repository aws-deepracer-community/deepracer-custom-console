// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import InternalButtonDropdown from '../../button-dropdown/internal';
import testutilStyles from '../test-classes/styles.css.js';
const mapDrawerToItem = (drawer) => ({
    id: drawer.id,
    text: drawer.ariaLabels.drawerName,
    iconName: drawer.trigger.iconName,
    iconSvg: drawer.trigger.iconSvg,
    badge: drawer.badge,
    itemType: 'checkbox',
    checked: drawer.active,
});
export default function OverflowMenu({ items: drawers, onItemClick, customTriggerBuilder, ariaLabel, globalDrawersStartIndex, }) {
    const itemsFlatList = drawers.map(mapDrawerToItem);
    let items;
    if (globalDrawersStartIndex !== undefined && globalDrawersStartIndex > 0) {
        items = [
            { items: itemsFlatList.slice(0, globalDrawersStartIndex) },
            { items: itemsFlatList.slice(globalDrawersStartIndex) },
        ];
    }
    else {
        items = itemsFlatList;
    }
    return (React.createElement(InternalButtonDropdown, { items: items, className: testutilStyles['overflow-menu'], onItemClick: onItemClick, ariaLabel: ariaLabel, variant: "icon", customTriggerBuilder: customTriggerBuilder, expandToViewport: true }));
}
//# sourceMappingURL=overflow-menu.js.map