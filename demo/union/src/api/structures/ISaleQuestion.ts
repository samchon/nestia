import { ISaleInquiry } from "./ISaleInquiry";

/**
 * Question article.
 * 
 * The `ISaleQuestion` is a type of question article wrriten by a consumer
 * who has something to ask about the sale.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export type ISaleQuestion = ISaleInquiry<ISaleQuestion.IContent>;
export namespace ISaleQuestion
{
    /**
     * Page request info of the question.
     */
    export type IRequest = ISaleInquiry.IRequest;

    /**
     * Summarized info of the question.
     */
    export type ISummary = ISaleInquiry.ISummary;

    /**
     * Content info of the question.
     */
    export type IContent = ISaleInquiry.IContent;
}