import React from 'react';
import { InternalBaseComponentProps } from '../internal/hooks/use-base-component';
import { AlertProps } from './interfaces';
declare const InternalAlert: React.ForwardRefExoticComponent<AlertProps & {
    type: AlertProps.Type;
} & InternalBaseComponentProps<HTMLDivElement> & React.RefAttributes<AlertProps.Ref>>;
export default InternalAlert;
//# sourceMappingURL=internal.d.ts.map