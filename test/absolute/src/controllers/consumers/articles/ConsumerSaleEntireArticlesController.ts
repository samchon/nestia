import * as nest from "@nestjs/common";

import { SaleEntireArticlesController } from "controllers/base/SaleEntireArticlesController";

@nest.Controller("consumers/:section/sales/:saleId/entire")
export class ConsumerSaleEntireArticlesController
    extends SaleEntireArticlesController
{
}