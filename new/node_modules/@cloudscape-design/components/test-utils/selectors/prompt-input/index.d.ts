import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/selectors";
export default class PromptInputWrapper extends ComponentWrapper {
    static rootSelector: string;
    findNativeTextarea(): ElementWrapper;
    findActionButton(): ElementWrapper;
    findSecondaryActions(): ElementWrapper;
    findSecondaryContent(): ElementWrapper;
}
