import * as express from "express";
import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { SaleInquiriesController } from "../../base/SaleInquiriesController";
import { ISaleAnswer } from "../../../api/structures/sales/articles/ISaleAnswer";
import { ISaleInquiry } from "../../../api/structures/sales/articles/ISaleInquiry";

export abstract class SellerSaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent>
    extends SaleInquiriesController<Request, Summary, Content>
{
    /**
     * Store a new answer.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param inquiryId ID of the target inquiry to be answered
     * @param input Content to archive
     * @return The inquiry with newly archived answer
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 401 unauthorized error when you've not logged in yet
     * @throw 403 forbidden error when the sale is not yours
     * @throw 422 unprocessable entity error when you've already answered
     */
    @helper.EncryptedRoute.Post(":inquiryId")
    public async store
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("inquiryId", "number") inquiryId: number, 
            @helper.EncryptedBody() input: ISaleAnswer.IStore
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;
        inquiryId;

        return null!;
    }

    /**
     * Update an answer.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param inquiryId ID of the target inquiry to be updated
     * @param input New content to be overwritten
     * @return The inquiry record after the update
     */
    @helper.EncryptedRoute.Post(":inquiryId")
    public async update
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("inquiryId", "number") inquiryId: number,
            @helper.EncryptedBody() input: ISaleAnswer.IStore,
        ): Promise<ISaleInquiry<Content>>
    {
        request;
        section;
        saleId;
        input;
        inquiryId;

        return null!;
    }

    /**
     * Remove an answer.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param inquiryId ID of the target inquiry that the answer would be erased
     * @return Empty object
     */
    @nest.Delete(":inquiryId")
    public async remove
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("inquiryId", "number") inquiryId: number
        ): Promise<void>
    {
        request;
        section;
        saleId;
        inquiryId;
    }
}