import * as nest from "@nestjs/common";

import { ConsumerSaleInquiriesController } from "./ConsumerSaleInquiriesController";
import { ISaleQuestion } from "../../../api/structures/sales/articles/ISaleQuestion";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController 
    extends ConsumerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent,
        ISaleQuestion.IStore>
{
}