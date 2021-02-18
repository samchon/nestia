import * as express from "express";
import { EncryptedBody, EncryptedRoute, TypedParam } from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { SaleInquiriesController } from "../../base/SaleInquiriesController";
import { ISaleInquiry } from "../../../../../api/structures/sales/articles/ISaleInquiry";

export abstract class ConsumerSaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent,
        Store extends ISaleInquiry.IStore>
    extends SaleInquiriesController<Request, Summary, Content>
{
    /**
     * Store a new inquiry.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param input Content to archive
     * @return Newly archived inquiry
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     */
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

    /**
     * Update an inquiry.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param id ID of the target article to be updated
     * @param input New content to be overwritten
     * @return The inquiry record after the update
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when the article is not yours
     */
    @EncryptedRoute.Post(":id")
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

    /**
     * Remove an inquiry.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param id ID of the target article to be erased
     * @return Empty object
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when the article is not yours
     */
    @EncryptedRoute.Delete(":id")
    public async remove
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