import { IPage } from "../../common/IPage";
import { ISaleAnswer } from "./ISaleAnswer";
import { ISaleArticle } from "./ISaleArticle";

export interface ISaleInquiry<Content extends ISaleInquiry.IContent> 
    extends ISaleArticle<Content>
{
    writer: string;
    answer: ISaleAnswer | null;
}

export namespace ISaleInquiry
{
    export interface IRequest extends IPage.IRequest<"writer"|"title"|"content">
    {
        answered: boolean;
    }

    export interface ISummary extends ISaleArticle.ISummary
    {
        writer: string;
        answered: boolean;
    }

    export type IContent = ISaleArticle.IContent;
    export interface IStore extends ISaleArticle.ISummary
    {
        writer: string;
        password: string;
    }
    export type IUpdate = ISaleArticle.IUpdate;
}