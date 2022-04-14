import * as nest from "@nestjs/common";

import { ISaleReview } from "@src/api/structures/sales/articles/ISaleReview";
import { SellerSaleInquiriesController } from "@src/controllers/sellers/articles/SellerSaleInquiriesController";

@nest.Controller("sellers/:section/sales/:saleId/reviews")
export class SellerSaleReviewsController 
    extends SellerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent>
{
}