import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { IPage } from "../api/structures/IPage";
import { ISaleEntireArtcle } from "../api/structures/ISaleEntireArticle";

@nest.Controller("consumers/:section/sales/:saleId/entire_articles")
export class ConsumerSaleEntireArticlesController {
    /**
     * List up entire sale articles.
     *
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param ipAddr IP Address of the client
     * @param href `window.location.href`
     * @param query More query parameters
     * @param input Page request info
     * @returns Paged the entire articles
     */
    @nest.Patch()
    public async index(
        @nest.Request() request: express.Request,
        @helper.TypedParam("section", "string") section: string,
        @helper.TypedParam("saleId", "number") saleId: number,
        @nest.Query("ip") ipAddr: string,
        @nest.Query("location.href") href: string,
        @nest.Query() query: ISaleEntireArtcle.IQuery,
        @nest.Body() input: ISaleEntireArtcle.IRequest,
    ): Promise<IPage<ISaleEntireArtcle.ISummary>> {
        request;
        section;
        saleId;
        href;
        ipAddr;
        query;

        return {
            pagination: {
                page: 1,
                limit: input.limit || 100,
                total_count: 2,
                total_pages: 1,
            },
            data: [
                {
                    writer: "someone",
                    answered: false,
                    id: 1,
                    title: "some-title",
                    hit: 0,
                    created_at: new Date().toString(),
                    updated_at: new Date().toString(),
                },
                {
                    writer: "someone",
                    answered: false,
                    id: 2,
                    title: "some-title",
                    hit: 0,
                    created_at: new Date().toString(),
                    updated_at: new Date().toString(),
                    score: 100,
                },
            ],
        };
    }

    /**
     * Get detailed sale article record.
     *
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param id ID of the target article
     * @returns The detailed article record
     */
    @nest.Get(":id")
    public async at(
        @nest.Request() request: express.Request,
        @helper.TypedParam("section", "string") section: string,
        @helper.TypedParam("saleId", "number") saleId: number,
        @helper.TypedParam("id", "number") id: number,
    ): Promise<ISaleEntireArtcle> {
        request;
        section;
        saleId;
        id;

        return {
            id: 0,
            hit: 0,
            writer: "someone",
            answer: null,
            created_at: new Date().toString(),
            contents: [
                {
                    id: "some-content-id",
                    title: "some-title",
                    body: "some-body-content",
                    files: [],
                    created_at: new Date().toString(),
                    score: Math.random() < 0.5 ? 100 : undefined!,
                },
            ],
        };
    }
}
