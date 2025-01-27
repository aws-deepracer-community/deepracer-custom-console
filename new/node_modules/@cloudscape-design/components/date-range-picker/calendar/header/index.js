// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { add } from 'date-fns';
import { renderMonthAndYear } from '../../../calendar/utils/intl';
import { useInternalI18n } from '../../../i18n/context.js';
import InternalLiveRegion from '../../../live-region/internal';
import { NextMonthButton, PrevMonthButton } from './header-button';
import styles from '../../styles.css.js';
export default function CalendarHeader({ baseDate, locale, onChangeMonth, previousMonthLabel, nextMonthLabel, isSingleGrid, headingIdPrefix, }) {
    const i18n = useInternalI18n('calendar');
    const prevMonthLabel = renderMonthAndYear(locale, add(baseDate, { months: -1 }));
    const currentMonthLabel = renderMonthAndYear(locale, baseDate);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: styles['calendar-header'] },
            React.createElement(PrevMonthButton, { ariaLabel: i18n('previousMonthAriaLabel', previousMonthLabel), baseDate: baseDate, onChangeMonth: onChangeMonth }),
            React.createElement("h2", { className: styles['calendar-header-months-wrapper'] },
                !isSingleGrid && (React.createElement("span", { className: styles['calendar-header-month'], id: `${headingIdPrefix}-prevmonth` }, prevMonthLabel)),
                React.createElement("span", { className: styles['calendar-header-month'], id: `${headingIdPrefix}-currentmonth` }, currentMonthLabel)),
            React.createElement(NextMonthButton, { ariaLabel: i18n('nextMonthAriaLabel', nextMonthLabel), baseDate: baseDate, onChangeMonth: onChangeMonth })),
        React.createElement(InternalLiveRegion, { hidden: true }, isSingleGrid ? currentMonthLabel : `${prevMonthLabel}, ${currentMonthLabel}`)));
}
//# sourceMappingURL=index.js.map