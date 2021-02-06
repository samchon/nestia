import * as nest from "@nestjs/common";

import { SaleCommentsController } from "../../../base/sales/articles/SaleCommentsController";

@nest.Controller("sellers/:section/sales/:saleId/comments")
export class SellerSaleCommentsController extends SaleCommentsController
{
}