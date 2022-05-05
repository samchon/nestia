/**
 * Comment wrote on an article.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleComment
{
    /**
     * Primary Key.
     */
    id: number;

    /**
     * Type of the writer.
     */
    writer_type: "seller" | "consumer";

    /**
     * Name of the writer.
     */
    writer_name: string;

    /**
     * Contents of the comments.
     * 
     * When the comment writer tries to modify content, it would not modify the comment
     * content but would be accumulated. Therefore, all of the people can read how
     * the content has been changed.
     */
    contents: ISaleComment.IContent[];

    /**
     * Creation time.
     */
    created_at: string;
}

export namespace ISaleComment
{
    /**
     * Store info.
     */
    export interface IStore
    {
        /**
         * Body of the content.
         */
        body: string;
    }

    /**
     * Content info.
     */
    export interface IContent extends IStore
    {
        /**
         * Creation time.
         */
        created_at: string;
    }
}