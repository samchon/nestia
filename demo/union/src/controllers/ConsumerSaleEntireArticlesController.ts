import * as express from "express";
import * as nest from "@nestjs/common";
import helper from "nestia-helper";

import { IPage } from "../api/structures/IPage";
import { ISaleEntireArtcle } from "../api/structures/ISaleEntireArticle";

@nest.Controller("consumers/:section/sales/:saleId/entire_articles")
export class ConsumerSaleEntireArticlesController
{
    /**
     * List up entire sale articles.
     * 
     * @param request Instance of the Express.Request
     * @param section Code of the target section
     * @param saleId ID of the target sale
     * @param input Page request info
     * @returns Paged the entire articles
     */
    @nest.Patch()
    public async index
        (
            @nest.Request() request: express.Request,
            @helper.TypedParam("section", "string") section: string, 
            @helper.TypedParam("saleId", "number") saleId: number, 
            @nest.Body() input: ISaleEntireArtcle.IRequest
        ): Promise<IPage<ISaleEntireArtcle.ISummary>>
    {
        request;
        section;
        saleId;
        input;
        
        return null!;
    }
}