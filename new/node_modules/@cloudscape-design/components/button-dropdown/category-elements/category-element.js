// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import ItemsList from '../items-list';
import styles from './styles.css.js';
const CategoryElement = ({ item, onItemActivate, onGroupToggle, targetItem, isHighlighted, isKeyboardHighlight, isExpanded, lastInDropdown, highlightItem, disabled, variant, position, }) => {
    // Hide the category title element from screen readers because it will be
    // provided as an ARIA label.
    return (React.createElement("li", { className: clsx(styles.category, styles[`variant-${variant}`], disabled && styles.disabled), role: "presentation", "aria-disabled": disabled ? 'true' : undefined },
        item.text && (React.createElement("p", { className: clsx(styles.header, { [styles.disabled]: disabled }), "aria-hidden": "true" }, item.text)),
        React.createElement("ul", { className: styles['items-list-container'], role: "group", "aria-label": item.text }, item.items && (React.createElement(ItemsList, { items: item.items, onItemActivate: onItemActivate, onGroupToggle: onGroupToggle, targetItem: targetItem, isHighlighted: isHighlighted, isKeyboardHighlight: isKeyboardHighlight, isExpanded: isExpanded, lastInDropdown: lastInDropdown, highlightItem: highlightItem, categoryDisabled: disabled, hasCategoryHeader: !!item.text, variant: variant, position: position })))));
};
export default CategoryElement;
//# sourceMappingURL=category-element.js.map