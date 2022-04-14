import * as nest from "@nestjs/common";

import { SaleCommentsController } from "controllers/base/SaleCommentsController";

@nest.Controller("sellers/:section/sales/:saleId/comments/:articleId")
export class SellerSaleCommentsController extends SaleCommentsController
{
}