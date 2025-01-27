"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selectors_1 = require("@cloudscape-design/test-utils-core/selectors");
const styles_selectors_js_1 = require("../../../prompt-input/test-classes/styles.selectors.js");
class PromptInputWrapper extends selectors_1.ComponentWrapper {
    findNativeTextarea() {
        return this.findByClassName(styles_selectors_js_1.default.textarea);
    }
    findActionButton() {
        return this.findByClassName(styles_selectors_js_1.default['action-button']);
    }
    findSecondaryActions() {
        return this.findByClassName(styles_selectors_js_1.default['secondary-actions']);
    }
    findSecondaryContent() {
        return this.findByClassName(styles_selectors_js_1.default['secondary-content']);
    }
}
exports.default = PromptInputWrapper;
PromptInputWrapper.rootSelector = styles_selectors_js_1.default.root;
//# sourceMappingURL=index.js.map