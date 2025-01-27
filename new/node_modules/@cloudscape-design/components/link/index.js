import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { getAnalyticsMetadataAttribute } from '@cloudscape-design/component-toolkit/internal/analytics-metadata';
import useBaseComponent from '../internal/hooks/use-base-component';
import { applyDisplayName } from '../internal/utils/apply-display-name';
import InternalLink from './internal';
const Link = React.forwardRef((_a, ref) => {
    var { fontSize = 'body-m', color = 'normal', external = false } = _a, props = __rest(_a, ["fontSize", "color", "external"]);
    const baseComponentProps = useBaseComponent('Link', {
        props: { color, external, fontSize, rel: props.rel, target: props.target, variant: props.variant },
    });
    const analyticsMetadata = {
        action: 'click',
        detail: {
            label: { root: 'self' },
            external: `${external}`,
        },
        component: {
            name: 'awsui.Link',
            label: { root: 'self' },
            properties: { variant: props.variant || 'secondary' },
        },
    };
    if (props.href) {
        analyticsMetadata.detail.href = props.href;
    }
    return (React.createElement(InternalLink, Object.assign({ fontSize: fontSize, color: color, external: external }, props, baseComponentProps, { ref: ref }, getAnalyticsMetadataAttribute(analyticsMetadata))));
});
applyDisplayName(Link, 'Link');
export default Link;
//# sourceMappingURL=index.js.map