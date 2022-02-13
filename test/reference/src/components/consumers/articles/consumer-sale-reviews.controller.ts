import * as nest from "@nestjs/common";

import { ConsumerSaleInquiriesController } from "./consumer-sale-inquiries.controller";
import { ISaleReview } from "../../../api/structures/sales/articles/ISaleReview";

@nest.Controller("consumers/:section/sales/:saleId/reviews")
export class ConsumerSaleReviewsController 
    extends ConsumerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent,
        ISaleReview.IStore>
{
}