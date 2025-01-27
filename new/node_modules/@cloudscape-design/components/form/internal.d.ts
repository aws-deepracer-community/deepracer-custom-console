/// <reference types="react" />
import { InternalBaseComponentProps } from '../internal/hooks/use-base-component';
import { FormProps } from './interfaces';
type InternalFormProps = {
    __injectAnalyticsComponentMetadata?: boolean;
} & FormProps & InternalBaseComponentProps;
export default function InternalForm({ children, header, errorText, errorIconAriaLabel: errorIconAriaLabelOverride, actions, secondaryActions, __internalRootRef, __injectAnalyticsComponentMetadata, ...props }: InternalFormProps): JSX.Element;
export {};
//# sourceMappingURL=internal.d.ts.map