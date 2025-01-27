import React from 'react';
import { SplitPanelContentProps } from './interfaces';
interface SplitPanelContentBottomProps extends SplitPanelContentProps {
    appLayoutMaxWidth: React.CSSProperties | undefined;
}
export declare function SplitPanelContentBottom({ baseProps, isOpen, splitPanelRef, cappedSize, header, resizeHandle, children, appLayoutMaxWidth, panelHeaderId, onToggle, }: SplitPanelContentBottomProps): JSX.Element;
export {};
//# sourceMappingURL=bottom.d.ts.map