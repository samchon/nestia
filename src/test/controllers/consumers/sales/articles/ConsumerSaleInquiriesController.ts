import * as express from "express";
import { EncryptedBody, EncryptedRoute, TypedParam } from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { SaleInquiriesController } from "../../../base/sales/articles/SaleInquiriesController";
import { ISaleInquiry } from "../../../../api/structures/sales/articles/ISaleInquiry";

export abstract class ConsumerSaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent,
        Store extends ISaleInquiry.IStore>
    extends SaleInquiriesController<Request, Summary, Content>
{
    @EncryptedRoute.Post()
    public async store
        (
            @nest.Request() request: express.Request,
            @TypedParam("section", "string") section: string, 
            @TypedParam("saleId", "number") saleId: number, 
            @EncryptedBody() input: Store
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;

        return null!;
    }

    @EncryptedRoute.Post()
    public async update
        (
            @nest.Request() request: express.Request,
            @TypedParam("section", "string") section: string, 
            @TypedParam("saleId", "number") saleId: number, 
            @TypedParam("id", "number") id: number,
            @EncryptedBody() input: Store,
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;
        id;

        return null!;
    }

    @EncryptedRoute.Delete(":id")
    public async delete
        (
            @nest.Request() request: express.Request,
            @TypedParam("section", "string") section: string, 
            @TypedParam("saleId", "number") saleId: number, 
            @TypedParam("id", "number") id: number
        ): Promise<object>
    {
        request;
        section;
        saleId;
        id;

        return {};
    }
}