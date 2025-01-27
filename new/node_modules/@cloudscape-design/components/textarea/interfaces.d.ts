import { BaseInputProps, InputAutoComplete, InputAutoCorrect, InputKeyEvents, InputSpellcheck } from '../input/interfaces';
import { BaseComponentProps } from '../internal/base-component';
import { FormFieldValidationControlProps } from '../internal/context/form-field-context';
import { BaseKeyDetail } from '../internal/events';
export interface TextareaProps extends BaseInputProps, InputKeyEvents, InputAutoCorrect, InputAutoComplete, InputSpellcheck, BaseComponentProps, FormFieldValidationControlProps {
    /**
     * Specifies the number of lines of text to set the height to.
     */
    rows?: number;
    /**
     * Specifies whether to disable browser spellcheck feature.
     * If you set this to `true`, it disables native browser capability
     * that checks for spelling/grammar errors.
     * If you don't set it, the behavior follows the default behavior
     * of the user's browser.
     *
     * @deprecated Use the `spellcheck` property instead.
     */
    disableBrowserSpellcheck?: boolean;
}
export declare namespace TextareaProps {
    type KeyDetail = BaseKeyDetail;
    interface ChangeDetail {
        /**
         * The new value of this textarea.
         */
        value: string;
    }
    interface Ref {
        /**
         * Sets input focus on the textarea control.
         */
        focus(): void;
    }
}
//# sourceMappingURL=interfaces.d.ts.map