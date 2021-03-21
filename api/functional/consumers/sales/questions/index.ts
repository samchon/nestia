import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import { Primitive } from "./../../../../Primitive";
import type { IConnection } from "./../../../../IConnection";

import type { ISaleInquiry } from "./../../../../structures/sales/articles/ISaleInquiry";
import type { ISaleArticle } from "./../../../../structures/sales/articles/ISaleArticle";
import type { IPage } from "./../../../../structures/common/IPage";


/**
 * Store a new inquiry.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param input Content to archive
 * @return Newly archived inquiry
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * 
 * @controller ConsumerSaleQuestionsController.store()
 * @path POST consumers/:section/sales/:saleId/questions/
 */
export function store(connection: IConnection, section: string, saleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/${section}/sales/${saleId}/questions/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleInquiry.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}

/**
 * Update an inquiry.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param id ID of the target article to be updated
 * @param input New content to be overwritten
 * @return The inquiry record after the update
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * @throw 403 forbidden error when the article is not yours
 * 
 * @controller ConsumerSaleQuestionsController.update()
 * @path POST consumers/:section/sales/:saleId/questions/:id
 */
export function update(connection: IConnection, section: string, saleId: number, id: number, input: Primitive<update.Input>): Promise<update.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/${section}/sales/${saleId}/questions/${id}`,
        input
    );
}
export namespace update
{
    export type Input = Primitive<ISaleInquiry.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}

/**
 * Remove an inquiry.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param id ID of the target article to be erased
 * @return Empty object
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 401 unauthorized error when you've not logged in yet
 * @throw 403 forbidden error when the article is not yours
 * 
 * @controller ConsumerSaleQuestionsController.remove()
 * @path DELETE consumers/:section/sales/:saleId/questions/:id
 */
export function remove(connection: IConnection, section: string, saleId: number, id: number): Promise<void>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":false},
        "DELETE",
        `consumers/${section}/sales/${saleId}/questions/${id}`
    );
}

/**
 * Get page of summarized inquiries.
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param input Information about pagination and searching
 * @return Page of the inquiries
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 404 not found error when unable to find the matched record
 * 
 * @controller ConsumerSaleQuestionsController.index()
 * @path GET consumers/:section/sales/:saleId/questions/
 */
export function index(connection: IConnection, section: string, saleId: number, input: Primitive<index.Query>): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/${section}/sales/${saleId}/questions/?${new URLSearchParams(input as any).toString()}`
    );
}
export namespace index
{
    export type Query = Primitive<ISaleInquiry.IRequest>;
    export type Output = Primitive<IPage<ISaleInquiry.ISummary>>;
}

/**
 * Get detailed record of an inquiry
 * 
 * @param connection Information of the remote HTTP(s) server with headers (+encryption password)
 * @param section Code of the target section
 * @param saleId ID of the target sale
 * @param id ID of the Target inquiry
 * @return Detailed record of the inquiry
 * @throw 400 bad request error when type of the input data is not valid
 * @throw 404 not found error when unable to find the matched record
 * 
 * @controller ConsumerSaleQuestionsController.at()
 * @path GET consumers/:section/sales/:saleId/questions/:id
 */
export function at(connection: IConnection, section: string, saleId: number, id: number): Promise<at.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/${section}/sales/${saleId}/questions/${id}`
    );
}
export namespace at
{
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
Primitive;
