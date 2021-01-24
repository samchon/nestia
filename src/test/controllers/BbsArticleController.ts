import * as express from "express";
import * as nest from "@nestjs/common";
import * as helper from "encrypted-nestjs";

import { IBbsArticle } from "../structures/IBbsArticle";
import { IPage } from "../structures/IPage";

@nest.Controller("bbs/:group")
export class TestController
{

    @nest.Get()
    public index
        (
            @nest.Request() request: express.Request,
            @nest.Body() input: IPage.IRequest<"writer"|"title"|"content">
        ): Promise<IPage<IBbsArticle.ISummary>>
    {
        request;
        input;

        return null!;
    }

    @nest.Get(":id")
    public at
        (
            @nest.Request() request: express.Request,
            @nest.Param("id") id: number
        ): Promise<IBbsArticle>
    {
        request;
        id;

        return null!;
    }

    @nest.Post()
    public store
        (
            @nest.Request() request: express.Request,
            @helper.EncryptedBody() input: IBbsArticle.IStore
        ): Promise<IBbsArticle>
    {
        request;
        input;

        return null!;
    }

    @nest.Put(":id")
    public update
        (
            @nest.Request() request: express.Request,
            @nest.Param("id") id: number,
            @nest.Body() input: IBbsArticle.IUpdate
        ): Promise<IBbsArticle>
    {
        request;
        id;
        input;

        return null!;
    }

    @nest.Delete(":id")
    public delete
        (
            @nest.Request() request: express.Request,
            @nest.Param("id") id: number,
            @helper.TypedParam("pid", "number") pid: number,
            @nest.Param("fid") fid: number
        ): Promise<object>
    {
        request;
        id;
        pid;
        fid;

        return null!;
    }

    public empty(id: number): boolean
    {
        id;
        return false;
    }
}