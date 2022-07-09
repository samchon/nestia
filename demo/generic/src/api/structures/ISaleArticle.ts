import { IAttachmentFile } from "./IAttachmentFile";

/**
 * Article about a sale.
 *
 * The `ISaleArticle` is a super type interface. Many sub-type articles would be
 * designed by extending this super type interface `ISaleArticle`.
 *
 * @template Content Content type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleArticle<Content extends ISaleArticle.IContent> {
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Hit count.
     *
     * How many consumers had read.
     */
    hit: number;

    /**
     * List of contents.
     *
     * When the article writer tries to modify content, it would not modify the article
     * content but would be accumulated. Therefore, all of the people can read how
     * the content has been changed.
     */
    contents: Content[];

    /**
     * Creation time.
     */
    created_at: string;
}
export namespace ISaleArticle {
    /**
     * Content info.
     */
    export interface IContent extends IStore {
        /**
         * Primary Key
         */
        id: string;

        /**
         * Creation time.
         */
        created_at: string;
    }

    /**
     * Store info.
     */
    export interface IStore {
        /**
         * Title of the content.
         */
        title: string;

        /**
         * Body of the content.
         */
        body: string;

        /**
         * Extension, content type (format).
         */
        extension: "html" | "md" | "txt";

        /**
         * Attached files.
         */
        files: IAttachmentFile[];
    }
}
