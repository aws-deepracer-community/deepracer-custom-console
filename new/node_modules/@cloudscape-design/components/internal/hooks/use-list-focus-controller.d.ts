/// <reference types="react" />
interface UseListFocusControllerOptions {
    nextFocusIndex: null | number;
    onFocusMoved: (target: HTMLElement, targetType: 'next' | 'prev' | 'show-more' | 'fallback') => void;
    listItemSelector: string;
    fallbackSelector?: string;
    showMoreSelector?: string;
}
export declare function useListFocusController({ nextFocusIndex, onFocusMoved, listItemSelector, fallbackSelector, showMoreSelector, }: UseListFocusControllerOptions): import("react").RefObject<HTMLDivElement>;
export {};
//# sourceMappingURL=use-list-focus-controller.d.ts.map