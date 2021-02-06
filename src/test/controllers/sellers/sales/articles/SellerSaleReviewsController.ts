import * as nest from "@nestjs/common";

import { SellerSaleInquiriesController } from "./SellerSaleInquiriesController";
import { ISaleReview } from "../../../../structures/sales/articles/ISaleReview";

@nest.Controller("sellers/:section/sales/:saleId/questions")
export class SellerSaleReviewsController 
    extends SellerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent>
{
}