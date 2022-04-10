import * as nest from "@nestjs/common";

import { ISaleReview } from "@api/structures/sales/articles/ISaleReview";
import { ConsumerSaleInquiriesController } from "./ConsumerSaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/reviews")
export class ConsumerSaleReviewsController 
    extends ConsumerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent,
        ISaleReview.IStore>
{
}