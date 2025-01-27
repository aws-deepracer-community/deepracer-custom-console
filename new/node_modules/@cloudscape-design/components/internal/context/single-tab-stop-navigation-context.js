// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { createContext, forwardRef, useContext, useImperativeHandle, useLayoutEffect, useRef, useState, } from 'react';
import { nodeBelongs } from '../utils/node-belongs';
export const defaultValue = {
    navigationActive: false,
    registerFocusable: () => () => { },
};
/**
 * Single tab stop navigation context is used together with keyboard navigation that requires a single tab stop.
 * It instructs interactive elements to override tab indices for just a single one to remain user-focusable.
 */
export const SingleTabStopNavigationContext = createContext(defaultValue);
export function useSingleTabStopNavigation(focusable, options) {
    var _a;
    const { navigationActive: contextNavigationActive, registerFocusable } = useContext(SingleTabStopNavigationContext);
    const [focusTargetActive, setFocusTargetActive] = useState(false);
    const navigationDisabled = (options === null || options === void 0 ? void 0 : options.tabIndex) && (options === null || options === void 0 ? void 0 : options.tabIndex) < 0;
    const navigationActive = contextNavigationActive && !navigationDisabled;
    useLayoutEffect(() => {
        if (navigationActive && focusable && focusable.current) {
            const unregister = registerFocusable(focusable.current, isFocusable => setFocusTargetActive(isFocusable));
            return () => unregister();
        }
    });
    let tabIndex = options === null || options === void 0 ? void 0 : options.tabIndex;
    if (navigationActive) {
        tabIndex = !focusTargetActive ? -1 : (_a = options === null || options === void 0 ? void 0 : options.tabIndex) !== null && _a !== void 0 ? _a : 0;
    }
    return { navigationActive, tabIndex };
}
export const SingleTabStopNavigationProvider = forwardRef(({ navigationActive, children, getNextFocusTarget, isElementSuppressed, onRegisterFocusable, onUnregisterActive, }, ref) => {
    // A set of registered focusable elements that can use keyboard navigation.
    const focusables = useRef(new Set());
    // A map of registered focusable element handlers to update the respective tab indices.
    const focusHandlers = useRef(new Map());
    // A map of focusable element states to avoid issuing unnecessary updates to registered elements.
    const focusablesState = useRef(new WeakMap());
    // A reference to the currently focused element.
    const focusTarget = useRef(null);
    function onUnregisterFocusable(focusableElement) {
        const isUnregisteringFocusedNode = nodeBelongs(focusableElement, document.activeElement);
        if (isUnregisteringFocusedNode) {
            // Wait for unmounted node to get removed from the DOM.
            setTimeout(() => onUnregisterActive === null || onUnregisterActive === void 0 ? void 0 : onUnregisterActive(focusableElement), 0);
        }
    }
    // Register a focusable element to allow navigating into it.
    // The focusable element tabIndex is only set to 0 if the element matches the focus target.
    function registerFocusable(focusableElement, changeHandler) {
        focusables.current.add(focusableElement);
        focusHandlers.current.set(focusableElement, changeHandler);
        const isFocusable = !!focusablesState.current.get(focusableElement);
        const newIsFocusable = focusTarget.current === focusableElement || !!(isElementSuppressed === null || isElementSuppressed === void 0 ? void 0 : isElementSuppressed(focusableElement));
        if (newIsFocusable !== isFocusable) {
            focusablesState.current.set(focusableElement, newIsFocusable);
            changeHandler(newIsFocusable);
        }
        onRegisterFocusable === null || onRegisterFocusable === void 0 ? void 0 : onRegisterFocusable(focusableElement);
        return () => unregisterFocusable(focusableElement);
    }
    function unregisterFocusable(focusableElement) {
        focusables.current.delete(focusableElement);
        focusHandlers.current.delete(focusableElement);
        onUnregisterFocusable === null || onUnregisterFocusable === void 0 ? void 0 : onUnregisterFocusable(focusableElement);
    }
    // Update focus target with next single focusable element and notify all registered focusables of a change.
    function updateFocusTarget() {
        var _a;
        focusTarget.current = getNextFocusTarget();
        for (const focusableElement of focusables.current) {
            const isFocusable = (_a = focusablesState.current.get(focusableElement)) !== null && _a !== void 0 ? _a : false;
            const newIsFocusable = focusTarget.current === focusableElement || !!(isElementSuppressed === null || isElementSuppressed === void 0 ? void 0 : isElementSuppressed(focusableElement));
            if (newIsFocusable !== isFocusable) {
                focusablesState.current.set(focusableElement, newIsFocusable);
                focusHandlers.current.get(focusableElement)(newIsFocusable);
            }
        }
    }
    function getFocusTarget() {
        return focusTarget.current;
    }
    function isRegistered(element) {
        return focusables.current.has(element);
    }
    useImperativeHandle(ref, () => ({ updateFocusTarget, getFocusTarget, isRegistered }));
    return (React.createElement(SingleTabStopNavigationContext.Provider, { value: { navigationActive, registerFocusable } }, children));
});
//# sourceMappingURL=single-tab-stop-navigation-context.js.map