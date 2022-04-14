import { ISaleArticle } from "./ISaleArticle";

export type ISaleAnswer = ISaleArticle<ISaleAnswer.IContent>;

export namespace ISaleAnswer
{
    export type IContent = ISaleArticle.IContent;
    export type IStore = ISaleArticle.IContent;
    export type IUpdate = ISaleArticle.IUpdate;
}