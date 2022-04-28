import * as nest from "@nestjs/common";

import { SaleEntireArticlesController } from "controllers/base/SaleEntireArticlesController";

@nest.Controller("sellers/:section/sales/:saleId/entire")
export class SellerSaleEntireArticlesController
    extends SaleEntireArticlesController
{
}