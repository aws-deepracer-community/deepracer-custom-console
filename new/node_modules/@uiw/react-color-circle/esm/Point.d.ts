import React from 'react';
import { SwatchRectRenderProps, SwatchProps } from '@uiw/react-color-swatch';
interface PointProps extends SwatchRectRenderProps {
    rectProps?: SwatchProps['rectProps'];
    className?: string;
}
export default function Point({ style, className, title, checked, color, onClick, rectProps }: PointProps): React.JSX.Element;
export {};
