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
    extends ISaleArticle<Content>
{
    /**
     * Name of the writer.
     */
    writer: string;

    /**
     * Formal answer from the seller.
     */
    answer: ISaleInquiryAnswer | null;
}
export namespace ISaleInquiry
{
    /**
     * Content type of the inquiry article.
     */
    export type IContent = ISaleArticle.IContent;

    /**
     * Store info of the inquiry article.
     */
    export type IStore = ISaleArticle.IStore;
}