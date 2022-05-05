import { IPage } from "../../common/IPage";
import { ISaleAnswer } from "./ISaleAnswer";
import { ISaleArticle } from "./ISaleArticle";

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
    answer: ISaleAnswer | null;
}

export namespace ISaleInquiry
{
    export interface IRequest extends IPage.IRequest<"writer"|"title"|"content">
    {
        answered: boolean;
    }

    /**
     * Summarized info of the inquiry article.
     */
    export interface ISummary extends ISaleArticle.ISummary
    {
        /**
         * Name of the writer.
         */
        writer: string;

        /**
         * Password of the inquiry article.
         */
        answered: boolean;
    }

    /**
     * Content type of the inquiry article.
     */
    export type IContent = ISaleArticle.IContent;

    /**
     * Store info of the inquiry article.
     */
    export interface IStore extends ISaleArticle.ISummary
    {
        /**
         * Name of the writer.
         */
        writer: string;

        /**
         * Password of the inquiry article.
         */
        password: string;
    }
    export type IUpdate = ISaleArticle.IUpdate;
}