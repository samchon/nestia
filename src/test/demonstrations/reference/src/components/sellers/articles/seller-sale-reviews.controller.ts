import * as nest from "@nestjs/common";

import { SellerSaleInquiriesController } from "./seller-sale-inquiries.controller";
import { ISaleReview } from "../../../api/structures/sales/articles/ISaleReview";

@nest.Controller("sellers/:section/sales/:saleId/reviews")
export class SellerSaleReviewsController 
    extends SellerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent>
{
}