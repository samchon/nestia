export interface ISaleComment
{
    id: number;
    writer_type: "seller" | "consumer";
    writer_name: string;
    content: string;
    created_at: string;
}

export namespace ISaleComment
{
    export interface IStore
    {
        content: string;
    }
}