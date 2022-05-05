import { IAttachmentFile } from "../../common/IAttachmentFile";
import { IPage } from "../../common/IPage";

/**
 * Article about a sale.
 * 
 * The `ISaleArticle` is a super type interface. Many sub-type articles would be
 * designed by extending this super type interface `ISaleArticle`.
 * 
 * @template Content Content type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleArticle<Content extends ISaleArticle.IContent>
{
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

export namespace ISaleArticle
{
    /**
     * Page request info.
     */
    export type IRequest = IPage.IRequest<"title"|"content">;

    /**
     * Summarized info of the article.
     */
    export interface ISummary
    {
        /**
         * Primary Key.
         */
        id: number;

        /**
         * Title of the article.
         */
        title: string;

        /**
         * Hit count.
         * 
         * How many consumers had read.
         */
        hit: number;

        /**
         * Creaiton time.
         */
        created_at: string;

        /**
         * Updated time.
         */
        updated_at: string;
    }

    /**
     * Content info.
     */
    export interface IContent extends IUpdate
    {
        /**
         * Primary key.
         */
        id: number;

        /**
         * Creation time.
         */
        created_at: string;
    }

    /**
     * Store info.
     */
    export type IStore = IUpdate;

    /**
     * Update info.
     */
    export interface IUpdate
    {
        /**
         * Title of the content/
         */
        title: string;

        /**
         * Body of the content.
         */
        body: string;

        /**
         * Attached files.
         */
        files: Omit<IAttachmentFile, "id">[];
    }
}