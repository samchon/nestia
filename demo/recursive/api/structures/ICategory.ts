/**
 * Systematic category info.
 *
 * This `ICategory` has been designed to represent a systematic classfication. Also, its
 * classification has hierarchical and recursive relationship. Therefore, its structure has
 * a tree shape through the {@link ICategory.children} property.
 *
 * If you want to see invert structure for getting parent information repeatedly, use the
 * {@link ICategory.IInvert} type instead.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ICategory extends ICategory.IBase {
    /**
     * Children categories.
     */
    children: ICategory[];
}
export namespace ICategory {
    /**
     * Invert structure of the {@link ICategory}.
     */
    export interface IInvert extends IBase {
        /**
         * Parent information.
         */
        parent: IInvert | null;
    }

    /**
     * Basic information of the {@link ICategory}.
     */
    export interface IBase {
        /**
         * Primary Key.
         */
        id: string;

        /**
         * Identifier code.
         */
        code: string;

        /**
         * Name of the category.
         */
        name: string;
    }
}
