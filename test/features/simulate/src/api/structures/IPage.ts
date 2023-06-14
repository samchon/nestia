export interface IPage<T> {
    data: T[];
    pagination: IPage.IPagination;
}
export namespace IPage {
    /**
     * Page request data
     */
    export interface IRequest {
        /**
         * @type uint
         */
        page?: number | null;

        /**
         * @type uint
         */
        limit?: number | null;
    }

    /**
     * Page information.
     */
    export interface IPagination {
        /**
         * @type uint
         */
        current: number;

        /**
         * @type uint
         */
        limit: number;

        /**
         * @type uint
         */
        records: number;

        /**
         * @type uint
         */
        pages: number;
    }
}
