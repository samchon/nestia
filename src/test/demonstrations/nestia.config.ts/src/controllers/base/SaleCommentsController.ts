import express from "express";
import helper from "nestia-helper";
import * as nest from "@nestjs/common";

import { IPage } from "@api/structures/common/IPage";
import { ISaleComment } from "@api/structures/sales/articles/ISaleComment";
import { IAttachmentFile } from "@api/structures/common/IAttachmentFile";

type P<T> = Promise<T>;

export abstract class SaleCommentsController
{
    @nest.Get("files")
    public async files
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number
        ): Promise<IPage<IAttachmentFile>>
    {
        return null!;
    }

    /**
     * Get page of comments.
     * 
     * Get list of the {@link ISaleComment comments} with {@link IPage pagination}.
     * 
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param articleId ID of the target article
     * @param input Information about pagination and searching
     * @return Page of the comments
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 404 not found error when unable to find the matched record
     */
    @helper.EncryptedRoute.Get()
    public async index
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
            @nest.Query() input: IPage.IRequest
        ): P<IPage<ISaleComment>>
    {
        return null!;
    }

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
    @helper.EncryptedRoute.Post()
    public async store
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
            @helper.EncryptedBody() input: ISaleComment.IStore
        ): Promise<ISaleComment>
    {
        return null!;
    }

    /**
     * Remove a comment.
     * 
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param articleId ID of the target article
     * @param commentId ID of the target comment to be erased
     * @return Empty object
     * 
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when the comment is not yours
     * @throw 404 not found error when unable to find the matched record
     */
    @nest.Delete(":commentId")
    public async remove
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
            @helper.TypedParam("commentId", "number") commentId: number
        ): Promise<void>
    {
    }
}