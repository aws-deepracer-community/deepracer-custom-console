import React from 'react';
interface ToolsHeaderProps {
    header: React.ReactNode;
    filter?: React.ReactNode;
    pagination?: React.ReactNode;
    preferences?: React.ReactNode;
    setLastUserAction?: (name: string) => void;
}
export default function ToolsHeader({ header, filter, pagination, preferences, setLastUserAction }: ToolsHeaderProps): JSX.Element;
export {};
//# sourceMappingURL=tools-header.d.ts.map