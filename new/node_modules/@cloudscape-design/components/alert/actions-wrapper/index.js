// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import { getAnalyticsMetadataAttribute } from '@cloudscape-design/component-toolkit/internal/analytics-metadata';
import InternalButton from '../../button/internal';
import styles from './styles.css.js';
function createActionButton(testUtilClasses, action, buttonText, onButtonClick) {
    if (!action && buttonText) {
        action = (React.createElement("span", Object.assign({}, getAnalyticsMetadataAttribute({
            action: 'buttonClick',
        })),
            React.createElement(InternalButton, { className: testUtilClasses.actionButton, onClick: onButtonClick, formAction: "none" }, buttonText)));
    }
    return action ? React.createElement("div", { className: testUtilClasses.actionSlot }, action) : null;
}
export const ActionsWrapper = ({ className, testUtilClasses, action, discoveredActions, buttonText, onButtonClick, }) => {
    const actionButton = createActionButton(testUtilClasses, action, buttonText, onButtonClick);
    if (!actionButton && discoveredActions.length === 0) {
        return null;
    }
    return (React.createElement("div", { className: clsx(styles.root, className) },
        actionButton,
        discoveredActions));
};
//# sourceMappingURL=index.js.map