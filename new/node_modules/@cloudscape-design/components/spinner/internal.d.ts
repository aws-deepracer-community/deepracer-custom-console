/// <reference types="react" />
import { InternalBaseComponentProps } from '../internal/hooks/use-base-component';
import { SpinnerProps } from './interfaces';
interface InternalSpinnerProps extends SpinnerProps, InternalBaseComponentProps {
}
export default function InternalSpinner({ size, variant, __internalRootRef, ...props }: InternalSpinnerProps): JSX.Element;
export {};
//# sourceMappingURL=internal.d.ts.map