import * as nest from "@nestjs/common";

import { SaleCommentsController } from "../../base/SaleCommentsController";

@nest.Controller("consumers/:section/sales/:saleId/comments/:articleId")
export class ConsumerSaleCommentsController extends SaleCommentsController
{
}