import * as nest from "@nestjs/common";

import { ConsumerSaleInquiriesController } from "./ConsumerSaleInquiriesController";
import { ISaleReview } from "../../../../structures/sales/articles/ISaleReview";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleReviewssController 
    extends ConsumerSaleInquiriesController<
        ISaleReview.IRequest,
        ISaleReview.ISummary,
        ISaleReview.IContent,
        ISaleReview.IStore>
{
}