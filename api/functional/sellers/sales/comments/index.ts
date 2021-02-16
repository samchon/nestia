import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../IConnection";
import type { Primitive } from "./../../../../Primitive";

import type { IPage } from "./../../../../structures/common/IPage";
import type { ISaleComment } from "./../../../../structures/sales/articles/ISaleComment";


// GET sellers/:section/sales/:saleId/comments/:articleId/
// SellerSaleCommentsController.index()
export function index(connection: IConnection, section: string, saleId: number, articleId: number): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `sellers/${section}/sales/${saleId}/comments/${articleId}/`
    );
}
export namespace index
{
    export type Output = Primitive<IPage<ISaleComment>>;
}

// POST sellers/:section/sales/:saleId/comments/:articleId/
// SellerSaleCommentsController.store()
export function store(connection: IConnection, section: string, saleId: number, articleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `sellers/${section}/sales/${saleId}/comments/${articleId}/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleComment.IStore>;
    export type Output = Primitive<ISaleComment>;
}

// DELETE sellers/:section/sales/:saleId/comments/:articleId/:commentId
// SellerSaleCommentsController.remove()
export function remove(connection: IConnection, section: string, saleId: number, articleId: number, commentId: number): Promise<remove.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "DELETE",
        `sellers/${section}/sales/${saleId}/comments/${articleId}/${commentId}`
    );
}
export namespace remove
{
    export type Output = Primitive<object>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
