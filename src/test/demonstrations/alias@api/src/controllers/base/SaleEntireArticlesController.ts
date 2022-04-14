import helper from "nestia-helper";
import * as nest from "@nestjs/common";

import { IPage } from "@api/structures/common/IPage";
import { ISaleEntireArtcle } from "@api/structures/sales/articles/ISaleEntireArticle";

export abstract class SaleEntireArticlesController
{
    @helper.EncryptedRoute.Get()
    public async index
        (
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @nest.Query() input: IPage.IRequest
        ): Promise<IPage<ISaleEntireArtcle.ISummary>>
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
        ): Promise<ISaleEntireArtcle>
    {
        section;
        saleId;
        id;

        return null!;
    }
}