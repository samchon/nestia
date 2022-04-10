import { IAttachmentFile } from "../../common/IAttachmentFile";
import { IPage } from "../../common/IPage";

export interface ISaleArticle<Content extends ISaleArticle.IContent>
{
    id: number;
    hit: number;
    contents: Content[];
    created_at: string;
}

export namespace ISaleArticle
{
    export type IRequest = IPage.IRequest<"title"|"content">;

    export interface ISummary
    {
        id: number;
        title: string;
        hit: number;
        created_at: string;
        updated_at: string;
    }

    export interface IContent extends IUpdate
    {
        id: number;
        created_at: string;
    }

    export type IStore = IUpdate;

    export interface IUpdate
    {
        title: string;
        content: string;
        files: Omit<IAttachmentFile, "id">[];
    }
}