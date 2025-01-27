import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { forwardRef } from 'react';
import flattenChildren from 'react-keyed-flatten-children';
import clsx from 'clsx';
import { getBaseProps } from '../internal/base-component';
import { useMergeRefs } from '../internal/hooks/use-merge-refs';
import styles from './styles.css.js';
const InternalSpaceBetween = forwardRef((_a, ref) => {
    var { direction = 'vertical', size, children, alignItems, __internalRootRef } = _a, props = __rest(_a, ["direction", "size", "children", "alignItems", "__internalRootRef"]);
    const mergedRef = useMergeRefs(ref, __internalRootRef);
    const baseProps = getBaseProps(props);
    /*
   Flattening the children allows us to "see through" React Fragments and nested arrays.
   */
    const flattenedChildren = flattenChildren(children);
    return (React.createElement("div", Object.assign({}, baseProps, { className: clsx(baseProps.className, styles.root, styles[direction], styles[`${direction}-${size}`], alignItems && styles[`align-${alignItems}`]), ref: mergedRef }), flattenedChildren.map(child => {
        const key = typeof child === 'object' ? child.key : undefined;
        return (React.createElement("div", { key: key, className: styles.child }, child));
    })));
});
export default InternalSpaceBetween;
//# sourceMappingURL=internal.js.map