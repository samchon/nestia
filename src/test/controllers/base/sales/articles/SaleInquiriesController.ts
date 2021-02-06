import * as helper from "encrypted-nestjs";

import { ISaleInquiry } from "../../../../structures/sales/articles/ISaleInquiry";
import { IPage } from "../../../../structures/common/IPage";

export abstract class SaleInquiriesController<
        Request extends ISaleInquiry.IRequest, 
        Summary extends ISaleInquiry.ISummary, 
        Content extends ISaleInquiry.IContent>
{
    @helper.EncryptedRoute.Patch()
    public async index
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @helper.EncryptedBody() input: Request
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