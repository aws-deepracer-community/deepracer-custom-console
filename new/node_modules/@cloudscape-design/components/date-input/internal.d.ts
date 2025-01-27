import React from 'react';
import { CalendarProps } from '../calendar/interfaces';
import { InternalBaseComponentProps } from '../internal/hooks/use-base-component';
import { DateInputProps } from './interfaces';
declare const InternalDateInput: React.ForwardRefExoticComponent<DateInputProps & InternalBaseComponentProps<any> & {
    granularity?: CalendarProps.Granularity | undefined;
} & React.RefAttributes<HTMLInputElement>>;
export default InternalDateInput;
//# sourceMappingURL=internal.d.ts.map