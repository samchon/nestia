import * as express from "express";
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { SaleInquiriesController } from "../../../base/sales/articles/SaleInquiriesController";
import { ISaleAnswer } from "../../../../api/structures/sales/articles/ISaleAnswer";
import { ISaleInquiry } from "../../../../api/structures/sales/articles/ISaleInquiry";

export abstract class SellerSaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent>
    extends SaleInquiriesController<Request, Summary, Content>
{
    @helper.EncryptedRoute.Post()
    public async store
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.EncryptedBody() input: ISaleAnswer.IStore
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;

        return null!;
    }

    @helper.EncryptedRoute.Post()
    public async update
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("id", "number") id: number,
            @helper.EncryptedBody() input: ISaleAnswer.IStore,
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;
        id;

        return null!;
    }

    @helper.EncryptedRoute.Delete(":id")
    public async delete
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("id", "number") id: number
        ): Promise<object>
    {
        request;
        section;
        saleId;
        id;

        return {};
    }
}