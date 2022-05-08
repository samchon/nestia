import * as nest from "@nestjs/common";

import { ISaleReview } from "@api/structures/ISaleReview";

import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/reviews")
export class ConsumerSaleReviewsController
    extends SaleInquiriesController<
        ISaleReview.IContent, 
        ISaleReview.IStore, 
        ISaleReview>
{
}