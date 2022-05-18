import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { ISaleArticleComment } from "../api/structures/ISaleArticleComment";

@nest.Controller({ path: [
    "consumers/:section/sales/:saleId/articles/:articleId/comments", 
    "sellers/:section/sales/:saleId/articles/:articleId/comments"
]})
export class MultipleCommentsController
{
    /**
     * Store a new comment.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
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
    @nest.Post([])
    public async store
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
            @nest.Body() body: ISaleArticleComment.IStore
        ): Promise<ISaleArticleComment>
    {
        request;
        section;
        saleId;
        articleId;
        body;

        return null!;
    }
}