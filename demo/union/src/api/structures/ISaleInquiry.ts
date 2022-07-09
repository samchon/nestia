import { IPage } from "./IPage";
import { ISaleArticle } from "./ISaleArticle";
import { ISaleInquiryAnswer } from "./ISaleInquiryAnswer";

/**
 * Inquiry article.
 *
 * Sub-type of article and super-type of question and answer.
 *
 * @template Content Content type
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface ISaleInquiry<Content extends ISaleInquiry.IContent>
    extends ISaleArticle<Content> {
    /**
     * Name of the writer.
     */
    writer: string;

    /**
     * Formal answer from the seller.
     */
    answer: ISaleInquiryAnswer | null;
}
export namespace ISaleInquiry {
    /**
     * Page request info.
     */
    export interface IRequest
        extends IPage.IRequest<"writer" | "title" | "content"> {
        /**
         * Whether being answer by seller or not.
         */
        answered: boolean;
    }

    /**
     * Summarized info of the inquiry article.
     */
    export interface ISummary extends ISaleArticle.ISummary {
        /**
         * Name of the writer.
         */
        writer: string;

        /**
         * Whether being answer by seller or not.
         */
        answered: boolean;
    }

    /**
     * Content type of the inquiry article.
     */
    export type IContent = ISaleArticle.IContent;
}
