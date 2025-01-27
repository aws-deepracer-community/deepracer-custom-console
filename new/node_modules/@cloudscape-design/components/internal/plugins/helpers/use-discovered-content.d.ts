import { ReactNode } from 'react';
import { AlertFlashContentApiInternal, ReplacementType } from '../controllers/alert-flash-content';
export declare function createUseDiscoveredContent(componentName: string, controller: AlertFlashContentApiInternal): ({ type, header, children, }: {
    type: string;
    header: ReactNode;
    children: ReactNode;
}) => {
    initialHidden: boolean;
    headerReplacementType: ReplacementType;
    contentReplacementType: ReplacementType;
    headerRef: import("react").Ref<HTMLDivElement>;
    replacementHeaderRef: import("react").Ref<HTMLDivElement>;
    contentRef: import("react").Ref<HTMLDivElement>;
    replacementContentRef: import("react").Ref<HTMLDivElement>;
};
//# sourceMappingURL=use-discovered-content.d.ts.map