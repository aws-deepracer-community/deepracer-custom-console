import React from 'react';
import { PopoverProps } from '../../../popover/interfaces';
export interface TooltipProps {
    value: React.ReactNode;
    trackRef: React.RefObject<HTMLElement | SVGElement>;
    trackKey?: string | number;
    position?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
    contentAttributes?: React.HTMLAttributes<HTMLDivElement>;
    size?: PopoverProps['size'];
    hideOnOverscroll?: boolean;
}
export default function Tooltip({ value, trackRef, trackKey, className, contentAttributes, position, size, hideOnOverscroll, }: TooltipProps): JSX.Element;
//# sourceMappingURL=index.d.ts.map