import { ISaleArticle } from "./ISaleArticle";

/**
 * Formal answer from the seller.
 *
 * When a consumer writes an inquiry about a sale, the seller can write a formal
 * answer article. This `ISaleInquiryAnswer` has been designed to represent such
 * formal answer article from the seller.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISaleInquiryAnswer = ISaleArticle<ISaleInquiryAnswer.IContent>;
export namespace ISaleInquiryAnswer {
    /**
     * Content type of the answer.
     */
    export type IContent = ISaleArticle.IContent;

    /**
     * Store info of the answer.
     */
    export type IStore = ISaleArticle.IContent;
}
