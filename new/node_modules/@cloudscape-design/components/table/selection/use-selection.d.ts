import { TableProps } from '../interfaces';
import { SelectionProps } from './interfaces';
type SelectionOptions<T> = Pick<TableProps<T>, 'ariaLabels' | 'isItemDisabled' | 'items' | 'loading' | 'onSelectionChange' | 'selectedItems' | 'selectionType' | 'trackBy'>;
export declare function useSelection<T>(options: SelectionOptions<T>): {
    isItemSelected: (item: T) => boolean;
    getSelectAllProps?: () => SelectionProps;
    getItemSelectionProps?: (item: T) => SelectionProps;
};
export {};
//# sourceMappingURL=use-selection.d.ts.map