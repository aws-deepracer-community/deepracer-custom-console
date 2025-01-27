import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import useBaseComponent from '../internal/hooks/use-base-component';
import { applyDisplayName } from '../internal/utils/apply-display-name';
import InternalHeader from './internal';
export default function Header(_a) {
    var { variant = 'h2' } = _a, props = __rest(_a, ["variant"]);
    const baseComponentProps = useBaseComponent('Header', {
        props: { headingTagOverride: props.headingTagOverride, variant },
    });
    return React.createElement(InternalHeader, Object.assign({ variant: variant }, props, baseComponentProps));
}
applyDisplayName(Header, 'Header');
//# sourceMappingURL=index.js.map