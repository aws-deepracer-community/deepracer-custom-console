// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import ResizeHandleIcon from './icon';
import styles from './styles.css.js';
export default React.forwardRef(function PanelResizeHandle({ className, ariaLabel, ariaValuenow, position, onKeyDown, onPointerDown }, ref) {
    return (React.createElement("div", { ref: ref, className: clsx(className, styles.slider, styles[`slider-${position}`]), role: "slider", tabIndex: 0, "aria-label": ariaLabel, "aria-valuemax": 100, "aria-valuemin": 0, "aria-valuenow": ariaValuenow, onKeyDown: onKeyDown, onPointerDown: onPointerDown },
        React.createElement(ResizeHandleIcon, { className: clsx(styles['slider-icon'], styles[`slider-icon-${position}`]) })));
});
//# sourceMappingURL=index.js.map