import { __rest } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useState } from 'react';
import clsx from 'clsx';
import { useInternalI18n } from '../i18n/context';
import { getBaseProps } from '../internal/base-component';
import Dropdown from '../internal/components/dropdown';
import DropdownFooter from '../internal/components/dropdown-footer/index.js';
import ScreenreaderOnly from '../internal/components/screenreader-only';
import { useFormFieldContext } from '../internal/context/form-field-context';
import { useUniqueId } from '../internal/hooks/use-unique-id';
import { joinStrings } from '../internal/utils/strings';
import Filter from '../select/parts/filter';
import PlainList from '../select/parts/plain-list';
import Trigger from '../select/parts/trigger';
import VirtualList from '../select/parts/virtual-list';
import InternalTokenGroup from '../token-group/internal';
import { useMultiselect } from './use-multiselect';
import styles from './styles.css.js';
const InternalMultiselect = React.forwardRef((_a, externalRef) => {
    var _b;
    var { options, filteringType, filteringPlaceholder, filteringAriaLabel, filteringClearAriaLabel, ariaRequired, placeholder, disabled, readOnly, ariaLabel, selectedOptions, deselectAriaLabel, tokenLimit, i18nStrings, virtualScroll, inlineTokens = false, hideTokens, expandToViewport, tokenLimitShowFewerAriaLabel, tokenLimitShowMoreAriaLabel, __internalRootRef = null, autoFocus } = _a, restProps = __rest(_a, ["options", "filteringType", "filteringPlaceholder", "filteringAriaLabel", "filteringClearAriaLabel", "ariaRequired", "placeholder", "disabled", "readOnly", "ariaLabel", "selectedOptions", "deselectAriaLabel", "tokenLimit", "i18nStrings", "virtualScroll", "inlineTokens", "hideTokens", "expandToViewport", "tokenLimitShowFewerAriaLabel", "tokenLimitShowMoreAriaLabel", "__internalRootRef", "autoFocus"]);
    const baseProps = getBaseProps(restProps);
    const formFieldContext = useFormFieldContext(restProps);
    const i18n = useInternalI18n('multiselect');
    const selfControlId = useUniqueId('trigger');
    const controlId = (_b = formFieldContext.controlId) !== null && _b !== void 0 ? _b : selfControlId;
    const ariaLabelId = useUniqueId('multiselect-ariaLabel-');
    const footerId = useUniqueId('multiselect-footer-');
    const [filteringValue, setFilteringValue] = useState('');
    const multiselectProps = useMultiselect(Object.assign({ options,
        selectedOptions,
        filteringType,
        disabled,
        deselectAriaLabel,
        controlId,
        ariaLabelId,
        footerId,
        filteringValue,
        setFilteringValue,
        externalRef }, restProps));
    const filter = (React.createElement(Filter, Object.assign({ clearAriaLabel: filteringClearAriaLabel, filteringType: filteringType, placeholder: filteringPlaceholder, ariaLabel: filteringAriaLabel, ariaRequired: ariaRequired, value: filteringValue }, multiselectProps.getFilterProps())));
    const trigger = (React.createElement(Trigger, Object.assign({ placeholder: placeholder, disabled: disabled, readOnly: readOnly, triggerProps: multiselectProps.getTriggerProps(disabled, autoFocus), selectedOption: null, selectedOptions: selectedOptions, triggerVariant: inlineTokens ? 'tokens' : 'placeholder', isOpen: multiselectProps.isOpen }, formFieldContext, { controlId: controlId, ariaLabelledby: joinStrings(formFieldContext.ariaLabelledby, ariaLabelId) })));
    const tokens = selectedOptions.map(option => ({
        label: option.label,
        disabled: disabled || option.disabled,
        labelTag: option.labelTag,
        description: option.description,
        iconAlt: option.iconAlt,
        iconName: option.iconName,
        iconUrl: option.iconUrl,
        iconSvg: option.iconSvg,
        tags: option.tags,
        dismissLabel: i18n('deselectAriaLabel', deselectAriaLabel === null || deselectAriaLabel === void 0 ? void 0 : deselectAriaLabel(option), format => { var _a; return format({ option__label: (_a = option.label) !== null && _a !== void 0 ? _a : '' }); }),
    }));
    const ListComponent = virtualScroll ? VirtualList : PlainList;
    const showTokens = !hideTokens && !inlineTokens && tokens.length > 0;
    const tokenGroupI18nStrings = {
        limitShowFewer: i18nStrings === null || i18nStrings === void 0 ? void 0 : i18nStrings.tokenLimitShowFewer,
        limitShowMore: i18nStrings === null || i18nStrings === void 0 ? void 0 : i18nStrings.tokenLimitShowMore,
    };
    const dropdownStatus = multiselectProps.dropdownStatus;
    const dropdownProps = multiselectProps.getDropdownProps();
    return (React.createElement("div", Object.assign({}, baseProps, { ref: __internalRootRef, className: clsx(styles.root, baseProps.className) }, multiselectProps.getWrapperProps()),
        React.createElement(Dropdown, Object.assign({}, dropdownProps, { ariaLabelledby: dropdownProps.dropdownContentRole ? joinStrings(ariaLabelId, controlId) : undefined, ariaDescribedby: dropdownProps.dropdownContentRole ? (dropdownStatus.content ? footerId : undefined) : undefined, open: multiselectProps.isOpen, trigger: trigger, header: filter, footer: dropdownStatus.isSticky ? (React.createElement(DropdownFooter, { content: multiselectProps.isOpen ? dropdownStatus.content : null, id: footerId })) : null, expandToViewport: expandToViewport, stretchBeyondTriggerWidth: true }),
            React.createElement(ListComponent, { listBottom: !dropdownStatus.isSticky ? (React.createElement(DropdownFooter, { content: multiselectProps.isOpen ? dropdownStatus.content : null, id: footerId })) : null, menuProps: multiselectProps.getMenuProps(), getOptionProps: multiselectProps.getOptionProps, filteredOptions: multiselectProps.filteredOptions, filteringValue: filteringValue, ref: multiselectProps.scrollToIndex, hasDropdownStatus: dropdownStatus.content !== null, checkboxes: true, useInteractiveGroups: true, screenReaderContent: multiselectProps.announcement, highlightType: multiselectProps.highlightType })),
        showTokens && (React.createElement(InternalTokenGroup, Object.assign({}, multiselectProps.getTokenProps(), { className: styles.tokens, alignment: "horizontal", limit: tokenLimit, items: tokens, i18nStrings: tokenGroupI18nStrings, limitShowMoreAriaLabel: tokenLimitShowMoreAriaLabel, limitShowFewerAriaLabel: tokenLimitShowFewerAriaLabel, disableOuterPadding: true, readOnly: readOnly }))),
        React.createElement(ScreenreaderOnly, { id: ariaLabelId }, ariaLabel)));
});
export default InternalMultiselect;
//# sourceMappingURL=internal.js.map