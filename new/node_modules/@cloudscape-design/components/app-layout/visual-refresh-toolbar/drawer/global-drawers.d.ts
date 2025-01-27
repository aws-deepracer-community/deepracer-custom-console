/// <reference types="react" />
import { AppLayoutInternals } from '../interfaces';
interface AppLayoutGlobalDrawersImplementationProps {
    appLayoutInternals: AppLayoutInternals;
}
export declare function AppLayoutGlobalDrawersImplementation({ appLayoutInternals, }: AppLayoutGlobalDrawersImplementationProps): JSX.Element;
export declare const createWidgetizedAppLayoutGlobalDrawers: (Loader?: typeof AppLayoutGlobalDrawersImplementation | undefined) => typeof AppLayoutGlobalDrawersImplementation;
export {};
//# sourceMappingURL=global-drawers.d.ts.map