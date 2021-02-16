import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../IConnection";
import type { Primitive } from "./../../../../Primitive";

import type { ISaleInquiry } from "./../../../../structures/sales/articles/ISaleInquiry";
import type { ISaleArticle } from "./../../../../structures/sales/articles/ISaleArticle";
import type { IPage } from "./../../../../structures/common/IPage";


// POST consumers/:section/sales/:saleId/questions/
// ConsumerSaleQuestionsController.store()
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

// POST consumers/:section/sales/:saleId/questions/:id
// ConsumerSaleQuestionsController.update()
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

// DELETE consumers/:section/sales/:saleId/questions/:id
// ConsumerSaleQuestionsController.remove()
export function remove(connection: IConnection, section: string, saleId: number, id: number): Promise<remove.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "DELETE",
        `consumers/${section}/sales/${saleId}/questions/${id}`
    );
}
export namespace remove
{
    export type Output = Primitive<object>;
}

// GET consumers/:section/sales/:saleId/questions/
// ConsumerSaleQuestionsController.index()
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

// GET consumers/:section/sales/:saleId/questions/:id
// ConsumerSaleQuestionsController.at()
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
