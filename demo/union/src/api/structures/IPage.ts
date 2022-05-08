/**
 * Paginated records.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IPage<T extends object>
{
    /**
     * Pagination info.
     */
    pagination: IPage.IPagination;

    /**
     * List of the records.
     */
    data: T[];
}
export namespace IPage
{
    /**
     * Pagenation info.
     */
    export interface IPagination
    {
        /**
         * Current page number.
         */
        page: number;

        /**
         * Maximum number of records per a page.
         * 
         * @default 100
         */
        limit: number;

        /**
         * Number of entire records.
         */
        total_count: number;

        /**
         * Number of total pages.
         */
        total_pages: number;
    }

    /**
     * Page request info.
     */
    export interface IRequest<Field extends string = string>
    {
        /**
         * Page number.
         */
        page?: number;

        /**
         * Maximum number of records per a page.
         * 
         * @default 100
         */
        limit?: number;

        /**
         * Search field(s).
         */
        search_fields?: Field[];

        /**
         * Search value.
         */
        search_value?: string;

        /**
         * Standard of sorting, list up fields with symbols.
         * 
         *   - Only field name (`id`): ASC
         *   - Plus symbol (`+id`): ASC
         *   - Minus symbol (`-id`): DESC
         */
        sort?: string;
    }
}