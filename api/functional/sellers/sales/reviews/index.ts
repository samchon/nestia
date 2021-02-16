import { AesPkcs5 } from "./../../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../../__internal/Fetcher";
import type { IConnection } from "./../../../../IConnection";
import type { Primitive } from "./../../../../Primitive";

import type { ISaleArticle } from "./../../../../structures/sales/articles/ISaleArticle";
import type { ISaleInquiry } from "./../../../../structures/sales/articles/ISaleInquiry";
import type { ISaleReview } from "./../../../../structures/sales/articles/ISaleReview";
import type { IPage } from "./../../../../structures/common/IPage";


// POST sellers/:section/sales/:saleId/reviews/
// SellerSaleReviewsController.store()
export function store(connection: IConnection, section: string, saleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `sellers/${section}/sales/${saleId}/reviews/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleArticle.IContent>;
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}

// POST sellers/:section/sales/:saleId/reviews/:id
// SellerSaleReviewsController.update()
export function update(connection: IConnection, section: string, saleId: number, id: number, input: Primitive<update.Input>): Promise<update.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `sellers/${section}/sales/${saleId}/reviews/${id}`,
        input
    );
}
export namespace update
{
    export type Input = Primitive<ISaleArticle.IContent>;
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}

// DELETE sellers/:section/sales/:saleId/reviews/:id
// SellerSaleReviewsController.remove()
export function remove(connection: IConnection, section: string, saleId: number, id: number): Promise<remove.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "DELETE",
        `sellers/${section}/sales/${saleId}/reviews/${id}`
    );
}
export namespace remove
{
    export type Output = Primitive<object>;
}

// GET sellers/:section/sales/:saleId/reviews/
// SellerSaleReviewsController.index()
export function index(connection: IConnection, section: string, saleId: number, input: Primitive<index.Query>): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `sellers/${section}/sales/${saleId}/reviews/?${new URLSearchParams(input as any).toString()}`
    );
}
export namespace index
{
    export type Query = Primitive<ISaleInquiry.IRequest>;
    export type Output = Primitive<IPage<ISaleReview.ISummary>>;
}

// GET sellers/:section/sales/:saleId/reviews/:id
// SellerSaleReviewsController.at()
export function at(connection: IConnection, section: string, saleId: number, id: number): Promise<at.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `sellers/${section}/sales/${saleId}/reviews/${id}`
    );
}
export namespace at
{
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}



//---------------------------------------------------------
// TO PREVENT THE UNUSED VARIABLE ERROR
//---------------------------------------------------------
AesPkcs5;
Fetcher;
