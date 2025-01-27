// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
let callbacks = [];
let listenerRegistered = false;
const onKeyDown = (event) => {
    if (event.key === 'Escape') {
        callbacks.forEach(callback => callback());
    }
};
export const registerTooltip = (onClose) => {
    callbacks.forEach(callback => callback());
    callbacks.push(onClose);
    if (!listenerRegistered) {
        listenerRegistered = true;
        document.addEventListener('keydown', onKeyDown);
    }
    return () => {
        deregisterTooltip(onClose);
    };
};
const deregisterTooltip = (onClose) => {
    callbacks = callbacks.filter(callback => callback !== onClose);
    if (listenerRegistered && callbacks.length === 0) {
        listenerRegistered = false;
        document.removeEventListener('keydown', onKeyDown);
    }
};
//# sourceMappingURL=registry.js.map