// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import PopoverArrow from '../../../popover/arrow';
import PopoverBody from '../../../popover/body';
import PopoverContainer from '../../../popover/container';
import Portal from '../portal';
import { Transition } from '../transition';
import styles from './styles.css.js';
export default function Tooltip({ value, trackRef, trackKey, className, contentAttributes = {}, position = 'top', size = 'small', hideOnOverscroll, }) {
    if (!trackKey && (typeof value === 'string' || typeof value === 'number')) {
        trackKey = value;
    }
    return (React.createElement(Portal, null,
        React.createElement("div", Object.assign({ className: clsx(styles.root, className) }, contentAttributes, { "data-testid": trackKey }),
            React.createElement(Transition, { in: true }, () => (React.createElement(PopoverContainer, { trackRef: trackRef, trackKey: trackKey, size: size, fixedWidth: false, position: position, zIndex: 7000, arrow: position => React.createElement(PopoverArrow, { position: position }), hideOnOverscroll: hideOnOverscroll },
                React.createElement(PopoverBody, { dismissButton: false, dismissAriaLabel: undefined, onDismiss: undefined, header: undefined }, value)))))));
}
//# sourceMappingURL=index.js.map