import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { IPage } from "../api/structures/IPage";
import { ISaleReview } from "../api/structures/ISaleReview";

@nest.Controller("consumers/:section/sales/:saleId/reviews")
export class ConsumerSaleQuestionsController {
    @nest.Patch()
    public async index(
        @nest.Request() request: express.Request,
        @helper.TypedParam("section", "string") section: string,
        @helper.TypedParam("saleId", "number") saleId: number,
        @nest.Query() query: ISaleReview.IQuery,
        @nest.Body() input: ISaleReview.IRequest,
    ): Promise<IPage<ISaleReview.ISummary>> {
        request;
        section;
        saleId;
        query;

        return {
            pagination: {
                page: 1,
                limit: input.limit || 100,
                total_count: 1,
                total_pages: 1,
            },
            data: [
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
}
