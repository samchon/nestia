import * as nest from "@nestjs/common";
import * as express from "express";

import core from "../../src/index";
import { ISaleArticleComment } from "../api/structures/ISaleArticleComment";

@nest.Controller(
    "consumers/:section/sales/:saleId/articles/:articleId/comments",
)
export class ConsumerSaleArticleCommentsController {
    /**
     * Store a new comment.
     *
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param articleId ID of the target article
     * @param input Content to write
     * @return Newly archived comment
     *
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when you're a seller and the sale is not yours
     * @throw 404 not found error when unable to find the matched record
     */
    @core.TypedRoute.Post()
    public async store(
        @nest.Request() request: express.Request,
        @core.TypedParam("section", "string") section: string,
        @core.TypedParam("saleId", "number") saleId: number,
        @core.TypedParam("articleId", "number") articleId: number,
        @core.TypedBody() input: ISaleArticleComment.IStore,
    ): Promise<ISaleArticleComment> {
        request;
        section;
        saleId;
        articleId;

        return {
            id: 0,
            parent_id: null,
            writer_type: "consumer",
            writer_name: input.annonymous ? null : "someone",
            contents: [
                {
                    id: "some-id",
                    body: input.body,
                    created_at: new Date().toString(),
                },
            ],
            created_at: new Date().toString(),
        };
    }
}
