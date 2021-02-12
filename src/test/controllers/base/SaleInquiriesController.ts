import * as helper from "encrypted-nestjs";
import * as nest from "@nestjs/common";

import { ISaleInquiry } from "../../../../api/structures/sales/articles/ISaleInquiry";
import { IPage } from "../../../../api/structures/common/IPage";

export abstract class SaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent>
{
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