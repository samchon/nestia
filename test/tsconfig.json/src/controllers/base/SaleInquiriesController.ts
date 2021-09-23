import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { ISaleInquiry } from "../../api/structures/sales/articles/ISaleInquiry";
import { IPage } from "../../api/structures/common/IPage";

export abstract class SaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent>
{
    /**
     * Get page of summarized inquiries.
     * 
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param input Information about pagination and searching
     * @return Page of the inquiries
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 404 not found error when unable to find the matched record
     */
    @helper.EncryptedRoute.Get()
    public async index
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @nest.Query() input: Request
        ): Promise<IPage<Summary>>
    {
        section;
        saleId;
        input;

        return null!;
    }

    /**
     * Get detailed record of an inquiry
     * 
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param id ID of the Target inquiry
     * @return Detailed record of the inquiry
     * 
     * @throw 400 bad request error when type of the input data is not valid
     * @throw 404 not found error when unable to find the matched record
     */
    @helper.EncryptedRoute.Get(":id")
    public async at
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.TypedParam("id", "number") id: number
        ): Promise<ISaleInquiry<Content>>
    {
        section;
        saleId;
        id;

        return null!;
    }
}