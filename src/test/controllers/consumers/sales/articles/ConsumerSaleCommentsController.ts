import * as nest from "@nestjs/common";

import { SaleCommentsController } from "../../../base/sales/articles/SaleCommentsController";

@nest.Controller("consumers/:section/sales/:saleId/comments")
export class ConsumerSaleCommentsController extends SaleCommentsController
{
}