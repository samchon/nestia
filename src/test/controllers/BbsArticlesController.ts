import * as express from "express";
import * as nest from "@nestjs/common";
import * as helper from "encrypted-nestjs";

import { IBbsArticle } from "../structures/IBbsArticle";
import { IPage } from "../structures/IPage";

@nest.Controller("bbs/:group")
export class BbsArticlesController
{
    @nest.Get()
    public index
        (
            @nest.Request() request: express.Request,
            @nest.Param("group") group: string,
            @nest.Body() input: IPage.IRequest<"writer"|"title"|"content">
        ): Promise<IPage<IBbsArticle.ISummary>>
    {
        request;
        group;
        input;

        return null!;
    }

    @nest.Get(":id")
    public at
        (
            @nest.Request() request: express.Request,
            @nest.Param("group") group: string,
            @nest.Param("id") id: number
        ): Promise<IBbsArticle>
    {
        request;
        group;
        id;

        return null!;
    }

    @nest.Post()
    public store
        (
            @nest.Request() request: express.Request,
            @nest.Param("group") group: string,
            @helper.EncryptedBody() input: IBbsArticle.IStore
        ): Promise<IBbsArticle>
    {
        request;
        group;
        input;

        return null!;
    }

    @nest.Put(":id")
    public update
        (
            @nest.Request() request: express.Request,
            @nest.Param("group") group: string,
            @nest.Param("id") id: number,
            @nest.Body() input: IBbsArticle.IUpdate
        ): Promise<IBbsArticle>
    {
        request;
        id;
        group;
        input;

        return null!;
    }

    @nest.Delete(":id")
    public delete
        (
            @nest.Request() request: express.Request,
            @nest.Param("group") group: string,
            @nest.Param("id") id: number
        ): Promise<object>
    {
        request;
        id;
        group;

        return null!;
    }

    public empty(id: number): boolean
    {
        id;
        return false;
    }
}