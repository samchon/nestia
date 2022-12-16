import { TypedBody, TypedRoute } from "@nestia/core";
import { Controller, Param, Request } from "@nestjs/common";
import express from "express";
import { v4 } from "uuid";

import { ISaleArticleComment } from "../api/structures/ISaleArticleComment";

const CODE_REGEX = "[0-9a-f]{7}";
const UUID_REGEX =
    "[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}";

@Controller(
    `consumers/:section(${CODE_REGEX})/sales/:saleId(${UUID_REGEX})/articles/:articleId(${UUID_REGEX})/comments`,
)
export class ConsumerSaleArticleCommentsController {
    /**
     * Store a new comment.
     *
     * Write a comment on a sale article. If you configure the comment to be
     * `anonymous`, only administrator, you and seller of the sale can read
     * the content.
     *
     * @param request Instance of the Express.Request
     * @param sectionCode Code of the target section
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
    @TypedRoute.Post()
    public async store(
        @Request() request: express.Request,
        @Param("section") sectionCode: string,
        @Param("saleId") saleId: string,
        @Param("articleId") articleId: string,
        @TypedBody() input: ISaleArticleComment.IStore,
    ): Promise<ISaleArticleComment> {
        request;
        sectionCode;
        saleId;
        articleId;

        return {
            id: 0,
            parent_id: null,
            writer_type: "consumer",
            writer_name: input.annonymous ? null : "someone",
            created_at: new Date().toString(),
            contents: [
                {
                    id: v4(),
                    body: input.body,
                    created_at: new Date().toString(),
                },
            ],
        };
    }
}
