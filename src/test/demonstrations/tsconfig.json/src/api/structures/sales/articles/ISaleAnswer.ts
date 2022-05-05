import { ISaleArticle } from "./ISaleArticle";

/**
 * Formal answer from the seller.
 * 
 * When a consumer writes an inquiry about a sale, the seller can write a formal
 * answer article. This `ISaleAnswer` has been designed to represent the formal
 * answer article from the seller.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISaleAnswer = ISaleArticle<ISaleAnswer.IContent>;

export namespace ISaleAnswer
{
    /**
     * Content type of the answer.
     */
    export type IContent = ISaleArticle.IContent;

    /**
     * Store info of the answer.
     */
    export type IStore = ISaleArticle.IContent;

    /**
     * Update info of the answer.
     */
    export type IUpdate = ISaleArticle.IUpdate;
}