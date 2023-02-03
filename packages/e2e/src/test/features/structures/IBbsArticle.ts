import { IPage } from "./IPage";

export namespace IBbsArticle {
    /**
     * Page request info with some options.
     */
    export interface IRequest extends IPage.IRequest {
        /**
         * Sorting options.
         *
         * The plus sign means ASC and minus sign means DESC.
         */
        sort?: IPage.IRequest.Sort<IRequest.SortableColumns>;
    }
    export namespace IRequest {
        /**
         * List of sortable columns.
         */
        export type SortableColumns =
            | "writer"
            | "title"
            | "created_at"
            | "updated_at";
    }

    /**
     * Summarized info.
     */
    export interface ISummary {
        id: string;
        writer: string;
        title: string;
        created_at: string;
        updated_at: string;
    }
}
