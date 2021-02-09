import * as nest from "@nestjs/common";

import { ConsumerSaleInquiriesController } from "./ConsumerSaleInquiriesController";
import { ISaleReview } from "../../../../api/structures/sales/articles/ISaleReview";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleReviewsController 
    extends ConsumerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent,
        ISaleReview.IStore>
{
}