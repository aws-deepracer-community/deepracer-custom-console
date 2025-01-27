import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useRef } from 'react';
import clsx from 'clsx';
import { getAnalyticsMetadataAttribute, } from '@cloudscape-design/component-toolkit/internal/analytics-metadata';
import { getBaseProps } from '../internal/base-component';
import AbstractSwitch from '../internal/components/abstract-switch';
import { useFormFieldContext } from '../internal/context/form-field-context';
import { fireNonCancelableEvent } from '../internal/events';
import useForwardFocus from '../internal/hooks/forward-focus';
import styles from './styles.css.js';
const InternalToggle = React.forwardRef((_a, ref) => {
    var { controlId, checked, name, disabled, readOnly, children, description, ariaLabel, ariaControls, onFocus, onBlur, onChange, __internalRootRef = null, __injectAnalyticsComponentMetadata } = _a, rest = __rest(_a, ["controlId", "checked", "name", "disabled", "readOnly", "children", "description", "ariaLabel", "ariaControls", "onFocus", "onBlur", "onChange", "__internalRootRef", "__injectAnalyticsComponentMetadata"]);
    const { ariaDescribedby, ariaLabelledby } = useFormFieldContext(rest);
    const baseProps = getBaseProps(rest);
    const checkboxRef = useRef(null);
    const analyticsMetadata = {};
    const analyticsComponentMetadata = {
        name: 'awsui.Toggle',
        label: { root: 'self' },
    };
    if (__injectAnalyticsComponentMetadata) {
        analyticsMetadata.component = analyticsComponentMetadata;
    }
    if (!disabled && !readOnly) {
        analyticsMetadata.detail = {
            selected: `${!checked}`,
        };
    }
    useForwardFocus(ref, checkboxRef);
    return (React.createElement(AbstractSwitch, Object.assign({}, baseProps, { className: clsx(styles.root, baseProps.className), controlClassName: clsx(styles['toggle-control'], {
            [styles['toggle-control-checked']]: checked,
            [styles['toggle-control-disabled']]: disabled,
            [styles['toggle-control-readonly']]: readOnly,
        }), outlineClassName: styles.outline, controlId: controlId, disabled: disabled, readOnly: readOnly, label: children, description: description, descriptionBottomPadding: true, ariaLabel: ariaLabel, ariaLabelledby: ariaLabelledby, ariaDescribedby: ariaDescribedby, ariaControls: ariaControls, nativeControl: nativeControlProps => (React.createElement("input", Object.assign({}, nativeControlProps, { ref: checkboxRef, type: "checkbox", checked: checked, name: name, "aria-disabled": readOnly && !disabled ? 'true' : undefined, onFocus: () => fireNonCancelableEvent(onFocus), onBlur: () => fireNonCancelableEvent(onBlur), 
            // empty handler to suppress React controllability warning
            onChange: () => { } }))), onClick: () => {
            var _a;
            (_a = checkboxRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            fireNonCancelableEvent(onChange, { checked: !checked });
        }, styledControl: 
        /*Using span, not div for HTML validity*/
        React.createElement("span", { className: clsx(styles['toggle-handle'], {
                [styles['toggle-handle-checked']]: checked,
                [styles['toggle-handle-disabled']]: disabled,
                [styles['toggle-handle-readonly']]: readOnly,
            }) }), __internalRootRef: __internalRootRef }, getAnalyticsMetadataAttribute(analyticsMetadata))));
});
export default InternalToggle;
//# sourceMappingURL=internal.js.map