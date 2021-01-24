export interface IBbsArticle extends IBbsArticle.ISummary
{
    content: string;
}

export namespace IBbsArticle
{
    export interface ISummary
    {
        id: number;
        writer: string;
        title: string;
        created_at: string;
    }

    export interface IStore
    {
        title: string;
        content: string;
    }

    export type IUpdate = IStore;
}