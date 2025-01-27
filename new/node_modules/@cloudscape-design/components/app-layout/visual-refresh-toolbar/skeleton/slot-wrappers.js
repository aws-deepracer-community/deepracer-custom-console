// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import styles from './styles.css.js';
export const ToolbarSlot = React.forwardRef(({ className, style, children }, ref) => (React.createElement("section", { ref: ref, className: clsx(styles['toolbar-container'], className), style: style }, children)));
export const NotificationsSlot = React.forwardRef(({ className, style, children }, ref) => (React.createElement("div", { ref: ref, className: clsx(styles['notifications-container'], className), style: style }, children)));
//# sourceMappingURL=slot-wrappers.js.map