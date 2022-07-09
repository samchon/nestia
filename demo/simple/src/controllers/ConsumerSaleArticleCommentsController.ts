import express from "express";
import { Controller, Param, Post, Request } from "@nestjs/common";
import { TypedBody, TypedRoute } from "nestia-helper";

import { ISaleArticleComment } from "../api/structures/ISaleArticleComment";

@Controller("consumers/:section/sales/:saleId/articles/:articleId/comments")
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
     * @param body Content to write
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
        @TypedBody() body: ISaleArticleComment.IStore,
    ): Promise<ISaleArticleComment> {
        return null!;
    }
}
