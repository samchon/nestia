import * as nest from "@nestjs/common";
import { SaleEntireArticlesController } from "../../base/SaleEntireArticlesController";

@nest.Controller("consumers/:section/sales/:saleId/entire")
export class ConsumerSaleEntireArticlesController
    extends SaleEntireArticlesController
{
}