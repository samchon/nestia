import * as nest from "@nestjs/common";

import { SaleEntireArticlesController } from "../../base/SaleEntireArticlesController";

@nest.Controller("selles/:section/sales/:saleId/entire")
export class SellerSaleEntireArticlesController
    extends SaleEntireArticlesController
{
}