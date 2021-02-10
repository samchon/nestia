import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import { IConnection } from "./../../../../IConnection";
import { Primitive } from "./../../../../Primitive";

import { IPage } from "./../../../../structures/common/IPage";
import { ISaleComment } from "./../../../../structures/sales/articles/ISaleComment";


// GET consumers/:section/sales/:saleId/comments/:articleId/
export function index(connection: IConnection, section: string, saleId: number, articleId: number): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/"${section}"/sales/"${saleId}"/comments/"${articleId}"/`
    );
}
export namespace index
{
    export type Output = Primitive<IPage<ISaleComment>>;
}

// POST consumers/:section/sales/:saleId/comments/:articleId/
export function store(connection: IConnection, section: string, saleId: number, articleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/"${section}"/sales/"${saleId}"/comments/"${articleId}"/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleComment.IStore>;
    export type Output = Primitive<ISaleComment>;
}

