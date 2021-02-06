import * as express from "express";
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { IPage } from "../../../../structures/common/IPage";
import { ISaleComment } from "../../../../structures/sales/articles/ISaleComment";

export abstract class SaleCommentsController
{
    @helper.EncryptedRoute.Get()
    public async index
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
        ): Promise<IPage<ISaleComment>>
    {
        section;
        saleId;
        articleId;

        return null!;
    }

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
        request;
        section;
        saleId;
        articleId;
        input;

        return null!;
    }

    public async delete
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("articleId", "number") articleId: number,
            @helper.TypedParam("commentId", "number") commentId: number
        )
    {
        section;
        saleId;
        articleId;
        commentId;

        return {};
    }
}