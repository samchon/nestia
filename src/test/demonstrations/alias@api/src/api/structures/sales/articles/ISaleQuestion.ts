import { ISaleInquiry } from "./ISaleInquiry";

/**
 * Question article.
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

    /**
     * Store info of the question.
     */
    export type IStore = ISaleInquiry.IStore;

    /**
     * Update info of the question.
     */
    export type IUpdate = ISaleInquiry.IUpdate;
}