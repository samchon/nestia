import { AesPkcs5 } from "./../../../__internal/AesPkcs5";
import { Fetcher } from "./../../../__internal/Fetcher";
import { IConnection } from "./../../../IConnection";
import { Primitive } from "./../../../Primitive";

import { IPage } from "./../../../structures/common/IPage";
import { ISaleComment } from "./../../../structures/sales/articles/ISaleComment";
import { ISaleInquiry } from "./../../../structures/sales/articles/ISaleInquiry";
import { ISaleArticle } from "./../../../structures/sales/articles/ISaleArticle";
import { ISaleReview } from "./../../../structures/sales/articles/ISaleReview";

export * as comments from "./comments";
export * as questions from "./questions";
export * as reviews from "./reviews";

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

// POST consumers/:section/sales/:saleId/questions/
export function store(connection: IConnection, section: string, saleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/"${section}"/sales/"${saleId}"/questions/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleInquiry.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}

// POST consumers/:section/sales/:saleId/questions/:id
export function update(connection: IConnection, section: string, saleId: number, id: number, input: Primitive<update.Input>): Promise<update.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/"${section}"/sales/"${saleId}"/questions/"${id}"`,
        input
    );
}
export namespace update
{
    export type Input = Primitive<ISaleInquiry.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}

// DELETE consumers/:section/sales/:saleId/questions/:id
export function remove(connection: IConnection, section: string, saleId: number, id: number): Promise<remove.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "DELETE",
        `consumers/"${section}"/sales/"${saleId}"/questions/"${id}"`
    );
}
export namespace remove
{
    export type Output = Primitive<object>;
}

// PATCH consumers/:section/sales/:saleId/questions/
export function index(connection: IConnection, section: string, saleId: number, input: Primitive<index.Input>): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "PATCH",
        `consumers/"${section}"/sales/"${saleId}"/questions/`,
        input
    );
}
export namespace index
{
    export type Input = Primitive<ISaleInquiry.IRequest>;
    export type Output = Primitive<IPage<ISaleInquiry.ISummary>>;
}

// GET consumers/:section/sales/:saleId/questions/:id
export function at(connection: IConnection, section: string, saleId: number, id: number): Promise<at.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/"${section}"/sales/"${saleId}"/questions/"${id}"`
    );
}
export namespace at
{
    export type Output = Primitive<ISaleInquiry<ISaleArticle.IContent>>;
}

// POST consumers/:section/sales/:saleId/reviews/
export function store(connection: IConnection, section: string, saleId: number, input: Primitive<store.Input>): Promise<store.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/"${section}"/sales/"${saleId}"/reviews/`,
        input
    );
}
export namespace store
{
    export type Input = Primitive<ISaleReview.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}

// POST consumers/:section/sales/:saleId/reviews/:id
export function update(connection: IConnection, section: string, saleId: number, id: number, input: Primitive<update.Input>): Promise<update.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "POST",
        `consumers/"${section}"/sales/"${saleId}"/reviews/"${id}"`,
        input
    );
}
export namespace update
{
    export type Input = Primitive<ISaleReview.IStore>;
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}

// DELETE consumers/:section/sales/:saleId/reviews/:id
export function remove(connection: IConnection, section: string, saleId: number, id: number): Promise<remove.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "DELETE",
        `consumers/"${section}"/sales/"${saleId}"/reviews/"${id}"`
    );
}
export namespace remove
{
    export type Output = Primitive<object>;
}

// PATCH consumers/:section/sales/:saleId/reviews/
export function index(connection: IConnection, section: string, saleId: number, input: Primitive<index.Input>): Promise<index.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":true,"output_encrypted":true},
        "PATCH",
        `consumers/"${section}"/sales/"${saleId}"/reviews/`,
        input
    );
}
export namespace index
{
    export type Input = Primitive<ISaleInquiry.IRequest>;
    export type Output = Primitive<IPage<ISaleReview.ISummary>>;
}

// GET consumers/:section/sales/:saleId/reviews/:id
export function at(connection: IConnection, section: string, saleId: number, id: number): Promise<at.Output>
{
    return Fetcher.fetch
    (
        connection,
        {"input_encrypted":false,"output_encrypted":true},
        "GET",
        `consumers/"${section}"/sales/"${saleId}"/reviews/"${id}"`
    );
}
export namespace at
{
    export type Output = Primitive<ISaleInquiry<ISaleReview.IContent>>;
}

