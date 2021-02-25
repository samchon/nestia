import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../IConnection";
import type { Primitive } from "./../../../../Primitive";

import type { IPage } from "./../../../../structures/common/IPage";
import type { ISaleComment } from "./../../../../structures/sales/articles/ISaleComment";


/**
 * Get page of comments.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param articleId ID of the target article
 * @param input Information about pagination and searching
 * @return Page of the comments
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 404 not found error when unable to find the matched record
 * 
 * @controller ConsumerSaleCommentsController.index()
 * @path GET consumers/:section/sales/:saleId/comments/:articleId/
 */
export function index(connection: IConnection, section: string, saleId: number, articleId: number, input: Primitive<index.Query>): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/${section}/sales/${saleId}/comments/${articleId}/?${new URLSearchParams(input as any).toString()}`
    );
}
export namespace index
{
    export type Query = Primitive<IPage.IRequest<string>>;
    export type Output = Primitive<IPage<ISaleComment>>;
}

/**
 * Store a new comment.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param articleId ID of the target article
 * @param input Content to write
 * @return Newly archived comment
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * @throw 403 forbidden error when you're a seller and the sale is not yours
 * @throw 404 not found error when unable to find the matched record
 * 
 * @controller ConsumerSaleCommentsController.store()
 * @path POST consumers/:section/sales/:saleId/comments/:articleId/
 */
export function store(connection: IConnection, section: string, saleId: number, articleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/${section}/sales/${saleId}/comments/${articleId}/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleComment.IStore>;
    export type Output = Primitive<ISaleComment>;
}

/**
 * Remove a comment.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param articleId ID of the target article
 * @param commentId ID of the target comment to be erased
 * @return Empty object
 * @throw 401 unauthorized error when you've not logged in yet
 * @throw 403 forbidden error when the comment is not yours
 * @throw 404 not found error when unable to find the matched record
 * 
 * @controller ConsumerSaleCommentsController.remove()
 * @path DELETE consumers/:section/sales/:saleId/comments/:articleId/:commentId
 */
export function remove(connection: IConnection, section: string, saleId: number, articleId: number, commentId: number): Promise<void>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":false},
        "DELETE",
        `consumers/${section}/sales/${saleId}/comments/${articleId}/${commentId}`
    );
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
