import { ComponentWrapper, ElementWrapper } from '@cloudscape-design/test-utils-core/dom';
export default class PromptInputWrapper extends ComponentWrapper {
    static rootSelector: string;
    findNativeTextarea(): ElementWrapper<HTMLTextAreaElement>;
    findActionButton(): ElementWrapper<HTMLButtonElement>;
    findSecondaryActions(): ElementWrapper<HTMLDivElement>;
    findSecondaryContent(): ElementWrapper<HTMLDivElement>;
    /**
     * Gets the value of the component.
     *
     * Returns the current value of the textarea.
     */
    getTextareaValue(): string;
    /**
     * Sets the value of the component and calls the onChange handler.
     *
     * @param value value to set the textarea to.
     */
    setTextareaValue(value: string): void;
}
