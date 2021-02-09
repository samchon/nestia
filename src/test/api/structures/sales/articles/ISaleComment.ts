export interface ISaleComment
{
    id: number;
    writer_type: "seller" | "consumer";
    writer_name: string;
    contents: ISaleComment.IContent[];
    created_at: string;
}

export namespace ISaleComment
{
    export interface IStore
    {
        content: string;
    }

    export interface IContent extends IStore
    {
        created_at: string;
    }
}