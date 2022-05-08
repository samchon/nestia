import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { ISaleInquiry } from "@api/structures/ISaleInquiry";

export abstract class SaleInquiriesController<
        Content extends ISaleInquiry.IContent,
        Store extends ISaleInquiry.IStore,
        Json extends ISaleInquiry<Content>>
{
    /**
     * Store a new inquiry.
     * 
     * Write a new article inquirying about a sale.
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
    @nest.Post()
    public async store
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "string") saleId: string,
            @nest.Body() input: Store
        ): Promise<Json>
    {
        return null!;
    }

    /**
     * Update an inquiry.
     * 
     * Update ordinary inquiry article. However, it would not modify the content reocrd
     * {@link ISaleInquiry.IContent}, but be accumulated into the {@link ISaleInquiry.contents}. 
     * Therefore, all of the poeple can read how the content has been changed.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param id ID of the target article to be updated
     * @param input New content to be overwritten
     * @return The newly created content record
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when the article is not yours
     */
    @nest.Put(":id")
    public async update
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "string") saleId: string,
            @helper.TypedParam("id", "number") id: number,
            @nest.Body() input: Store
        ): Promise<Json>
    {
        return null!;
    }
}