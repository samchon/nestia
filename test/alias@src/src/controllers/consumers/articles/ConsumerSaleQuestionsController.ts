import * as nest from "@nestjs/common";

import { ISaleQuestion } from "@src/api/structures/sales/articles/ISaleQuestion";
import { ConsumerSaleInquiriesController } from "@src/controllers/consumers/articles/ConsumerSaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController 
    extends ConsumerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent,
        ISaleQuestion.IStore>
{
}