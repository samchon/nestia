/**
 * Comment wrote on a sale related article.
 *
 * When an article of a sale has been enrolled, all of the participants like consumers and
 * sellers can write a comment on that article. However, when the writer is a consumer, the
 * consumer can hide its name through the annoymous option.
 *
 * Also, writing a reply comment for a specific comment is possible and in that case, the
 * {@link ISaleArticleComment.parent_id} property would be activated.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleArticleComment {
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Parent comment ID.
     *
     * Only When this comment has been written as a reply.
     */
    parent_id: number | null;

    /**
     * Type of the writer.
     */
    writer_type: "seller" | "consumer";

    /**
     * Name of the writer.
     *
     * When this is a type of anonymous comment, writer name would be hidden.
     */
    writer_name: string | null;

    /**
     * Contents of the comments.
     *
     * When the comment writer tries to modify content, it would not modify the comment
     * content but would be accumulated. Therefore, all of the people can read how
     * the content has been changed.
     */
    contents: ISaleArticleComment.IContent[];

    /**
     * Creation time.
     */
    created_at: string;
}

export namespace ISaleArticleComment {
    /**
     * Store info.
     */
    export interface IStore {
        /**
         * Body of the content.
         */
        body: string;

        /**
         * Extension, content type (format).
         */
        extension: "html" | "md" | "txt";

        /**
         * Whether to hide the writer name or not.
         */
        annonymous: boolean;
    }

    /**
     * Content info.
     */
    export interface IContent {
        /**
         * Primary Key.
         */
        id: string;

        /**
         * Body of the content.
         */
        body: string;

        /**
         * Creation time.
         */
        created_at: string;
    }
}
