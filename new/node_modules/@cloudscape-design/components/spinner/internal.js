import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import clsx from 'clsx';
import { getBaseProps } from '../internal/base-component';
import { useModalContextLoadingComponent } from '../internal/hooks/use-modal-component-analytics';
import styles from './styles.css.js';
export default function InternalSpinner(_a) {
    var { size = 'normal', variant = 'normal', __internalRootRef } = _a, props = __rest(_a, ["size", "variant", "__internalRootRef"]);
    const baseProps = getBaseProps(props);
    useModalContextLoadingComponent();
    return (React.createElement("span", Object.assign({}, baseProps, { className: clsx(baseProps.className, styles.root, styles[`size-${size}`], styles[`variant-${variant}`]), ref: __internalRootRef }),
        React.createElement("span", { className: clsx(styles.circle, styles['circle-left']) }),
        React.createElement("span", { className: clsx(styles.circle, styles['circle-right']) })));
}
//# sourceMappingURL=internal.js.map