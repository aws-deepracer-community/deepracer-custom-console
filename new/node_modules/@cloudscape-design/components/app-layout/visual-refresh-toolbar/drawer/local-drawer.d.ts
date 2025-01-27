/// <reference types="react" />
import { AppLayoutInternals } from '../interfaces';
interface AppLayoutDrawerImplementationProps {
    appLayoutInternals: AppLayoutInternals;
}
export declare function AppLayoutDrawerImplementation({ appLayoutInternals }: AppLayoutDrawerImplementationProps): JSX.Element;
export declare const createWidgetizedAppLayoutDrawer: (Loader?: typeof AppLayoutDrawerImplementation | undefined) => typeof AppLayoutDrawerImplementation;
export {};
//# sourceMappingURL=local-drawer.d.ts.map