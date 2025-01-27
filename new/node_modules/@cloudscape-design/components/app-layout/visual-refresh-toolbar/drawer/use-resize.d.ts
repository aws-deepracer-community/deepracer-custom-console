import React from 'react';
interface ResizeProps {
    currentWidth: number;
    minWidth: number;
    maxWidth: number;
    panelRef: React.RefObject<HTMLDivElement>;
    handleRef: React.RefObject<HTMLDivElement>;
    onResize: (newWidth: number) => void;
}
export declare function useResize({ currentWidth, minWidth, maxWidth, panelRef, handleRef, onResize }: ResizeProps): {
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    onPointerDown: () => void;
    relativeSize: number;
};
export {};
//# sourceMappingURL=use-resize.d.ts.map