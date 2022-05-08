import * as nest from "@nestjs/common";

import { ISaleQuestion } from "@api/structures/ISaleQuestion";

import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController
    extends SaleInquiriesController<
        ISaleQuestion.IContent, 
        ISaleQuestion.IStore, 
        ISaleQuestion>
{
}