/**
 * Paged record set.
 *
 * @author Samchon
 */
export interface IPage<T extends object> {
    /**
     * Pagination info.
     */
    pagination: IPage.IPagination;

    /**
     * List of records
     */
    data: T[];
}
export namespace IPage {
    /**
     * Pagination info.
     */
    export interface IPagination {
        /**
         * Current page number.
         *
         * Starts from 1.
         */
        page: number;

        /**
         * Limit records per a page.
         *
         * @default 100
         */
        limit: number;

        /**
         * Number of total records.
         */
        total_count: number;

        /**
         * Number of total pages.
         */
        total_pages: number;
    }

    /**
     * Request info of page.
     */
    export interface IRequest {
        /**
         * Target page number.
         *
         * @default 1
         */
        page?: number;

        /**
         * Limit per a page.
         *
         * @defualt 100
         */
        limit?: number;
    }
    export namespace IRequest {
        export type Sort<Literal extends string> = Array<
            `-${Literal}` | `+${Literal}`
        >;
    }
}
