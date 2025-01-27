import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useContext, useRef } from 'react';
import clsx from 'clsx';
import { useInternalI18n } from '../i18n/context';
import InternalIcon from '../icon/internal';
import { FunnelMetrics } from '../internal/analytics';
import { useFunnel, useFunnelStep, useFunnelSubStep } from '../internal/analytics/hooks/use-funnel';
import { DATA_ATTR_FUNNEL_VALUE, getFunnelValueSelector, getSubStepAllSelector, getTextFromSelector, } from '../internal/analytics/selectors';
import { getBaseProps } from '../internal/base-component';
import { InfoLinkLabelContext } from '../internal/context/info-link-label-context';
import { LinkDefaultVariantContext } from '../internal/context/link-default-variant-context';
import { useSingleTabStopNavigation } from '../internal/context/single-tab-stop-navigation-context';
import { fireCancelableEvent, fireNonCancelableEvent, isPlainLeftClick } from '../internal/events';
import useForwardFocus from '../internal/hooks/forward-focus';
import { useMergeRefs } from '../internal/hooks/use-merge-refs';
import { useUniqueId } from '../internal/hooks/use-unique-id';
import { useVisualRefresh } from '../internal/hooks/use-visual-mode';
import { KeyCode } from '../internal/keycode';
import { checkSafeUrl } from '../internal/utils/check-safe-url';
import styles from './styles.css.js';
const InternalLink = React.forwardRef((_a, ref) => {
    var { variant: providedVariant, fontSize = 'body-m', color = 'normal', external = false, target, href, rel, ariaLabel, externalIconAriaLabel, onFollow, onClick, children, __internalRootRef = null } = _a, props = __rest(_a, ["variant", "fontSize", "color", "external", "target", "href", "rel", "ariaLabel", "externalIconAriaLabel", "onFollow", "onClick", "children", "__internalRootRef"]);
    checkSafeUrl('Link', href);
    const isButton = !href;
    const { defaultVariant } = useContext(LinkDefaultVariantContext);
    const variant = providedVariant || defaultVariant;
    const specialStyles = ['top-navigation', 'link', 'recovery'];
    const hasSpecialStyle = specialStyles.indexOf(variant) > -1;
    const i18n = useInternalI18n('link');
    const baseProps = getBaseProps(props);
    const anchorTarget = target !== null && target !== void 0 ? target : (external ? '_blank' : undefined);
    const anchorRel = rel !== null && rel !== void 0 ? rel : (anchorTarget === '_blank' ? 'noopener noreferrer' : undefined);
    const uniqueId = useUniqueId('link');
    const linkId = useUniqueId('link-self');
    const infoId = useUniqueId('link-info');
    const infoLinkLabelFromContext = useContext(InfoLinkLabelContext);
    const { funnelIdentifier, funnelInteractionId } = useFunnel();
    const { stepIdentifier, stepNumber, stepNameSelector } = useFunnelStep();
    const { subStepIdentifier, subStepSelector, subStepNameSelector } = useFunnelSubStep();
    const fireFunnelEvent = (funnelInteractionId) => {
        if (variant === 'info') {
            const stepName = getTextFromSelector(stepNameSelector);
            const subStepName = getTextFromSelector(subStepNameSelector);
            FunnelMetrics.helpPanelInteracted({
                funnelIdentifier,
                funnelInteractionId,
                stepIdentifier,
                stepNumber,
                stepName,
                subStepIdentifier,
                stepNameSelector,
                subStepSelector,
                subStepName,
                subStepNameSelector,
                elementSelector: getFunnelValueSelector(uniqueId),
                subStepAllSelector: getSubStepAllSelector(),
            });
        }
        else if (external) {
            const stepName = getTextFromSelector(stepNameSelector);
            const subStepName = getTextFromSelector(subStepNameSelector);
            FunnelMetrics.externalLinkInteracted({
                funnelIdentifier,
                funnelInteractionId,
                stepIdentifier,
                stepNumber,
                stepName,
                stepNameSelector,
                subStepIdentifier,
                subStepSelector,
                subStepName,
                subStepNameSelector,
                elementSelector: getFunnelValueSelector(uniqueId),
                subStepAllSelector: getSubStepAllSelector(),
            });
        }
    };
    const fireFollowEvent = (event) => {
        if (funnelInteractionId) {
            fireFunnelEvent(funnelInteractionId);
        }
        fireCancelableEvent(onFollow, { href, external, target: anchorTarget }, event);
    };
    const fireClickEvent = (event) => {
        const { altKey, ctrlKey, metaKey, shiftKey } = event;
        const button = 'button' in event ? event.button : 0;
        // make onClick non-cancelable to prevent it from being used to block full page reload
        // for navigation use `onFollow` event instead
        fireNonCancelableEvent(onClick, { altKey, button, ctrlKey, metaKey, shiftKey });
    };
    const handleLinkClick = (event) => {
        if (isPlainLeftClick(event)) {
            fireFollowEvent(event);
        }
        fireClickEvent(event);
    };
    const handleButtonClick = (event) => {
        fireFollowEvent(event);
        fireClickEvent(event);
    };
    const handleButtonKeyDown = (event) => {
        if (event.keyCode === KeyCode.space || event.keyCode === KeyCode.enter) {
            event.preventDefault();
            fireFollowEvent(event);
            fireClickEvent(event);
        }
    };
    const linkRef = useRef(null);
    const isVisualRefresh = useVisualRefresh();
    useForwardFocus(ref, linkRef);
    // Visual refresh should only add styles to buttons that don't already have unique styles (e.g. primary/secondary variants)
    const applyButtonStyles = isButton && isVisualRefresh && !hasSpecialStyle;
    const sharedProps = Object.assign(Object.assign({ id: linkId }, baseProps), { 
        // https://github.com/microsoft/TypeScript/issues/36659
        ref: useMergeRefs(linkRef, __internalRootRef), className: clsx(styles.link, baseProps.className, applyButtonStyles ? styles.button : null, styles[getVariantStyle(variant)], styles[getFontSizeStyle(variant, fontSize)], styles[getColorStyle(variant, color)]), 'aria-label': ariaLabel, 'aria-labelledby': undefined, [DATA_ATTR_FUNNEL_VALUE]: uniqueId });
    if (variant === 'info' && infoLinkLabelFromContext && !ariaLabel) {
        sharedProps['aria-labelledby'] = `${sharedProps.id} ${infoId} ${infoLinkLabelFromContext}`;
    }
    const renderedExternalIconAriaLabel = i18n('externalIconAriaLabel', externalIconAriaLabel);
    const content = (React.createElement(React.Fragment, null,
        children,
        external && (React.createElement("span", { className: styles['icon-wrapper'] },
            "\u00A0",
            React.createElement("span", { className: styles.icon, "aria-label": renderedExternalIconAriaLabel, role: renderedExternalIconAriaLabel ? 'img' : undefined },
                React.createElement(InternalIcon, { name: "external", size: "inherit" })))),
        variant === 'info' && (React.createElement("span", { hidden: true, id: infoId }, ":"))));
    const { tabIndex } = useSingleTabStopNavigation(linkRef, { tabIndex: isButton ? 0 : undefined });
    if (isButton) {
        return (React.createElement("a", Object.assign({}, sharedProps, { role: "button", tabIndex: tabIndex, onKeyDown: handleButtonKeyDown, onClick: handleButtonClick }), content));
    }
    return (
    // we dynamically set proper rel in the code above
    // eslint-disable-next-line react/jsx-no-target-blank
    React.createElement("a", Object.assign({}, sharedProps, { tabIndex: tabIndex, target: anchorTarget, rel: anchorRel, href: href, onClick: handleLinkClick }), content));
});
function getVariantStyle(variant) {
    return `variant-${variant.replace(/^awsui-/, '')}`;
}
function getFontSizeStyle(variant, fontSize) {
    switch (variant) {
        case 'info':
            return 'font-size-body-s';
        case 'awsui-value-large':
            return 'font-size-display-l';
        default:
            return `font-size-${fontSize}`;
    }
}
function getColorStyle(variant, color) {
    return `color-${variant === 'info' ? 'normal' : color}`;
}
export default InternalLink;
//# sourceMappingURL=internal.js.map