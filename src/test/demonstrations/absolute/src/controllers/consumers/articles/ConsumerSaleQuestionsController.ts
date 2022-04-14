import * as nest from "@nestjs/common";

import { ISaleQuestion } from "api/structures/sales/articles/ISaleQuestion";

import { ConsumerSaleInquiriesController } from "controllers/consumers/articles/ConsumerSaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController 
    extends ConsumerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent,
        ISaleQuestion.IStore>
{
}