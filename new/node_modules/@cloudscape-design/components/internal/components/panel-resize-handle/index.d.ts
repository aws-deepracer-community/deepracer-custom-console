import React from 'react';
interface ResizeHandleProps {
    className?: string;
    ariaLabel: string | undefined;
    position: 'side' | 'bottom';
    ariaValuenow: number;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}
declare const _default: React.ForwardRefExoticComponent<ResizeHandleProps & React.RefAttributes<HTMLDivElement>>;
export default _default;
//# sourceMappingURL=index.d.ts.map