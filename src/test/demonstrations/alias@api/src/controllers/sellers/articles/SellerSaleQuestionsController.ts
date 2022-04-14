import * as nest from "@nestjs/common";

import { ISaleQuestion } from "@api/structures/sales/articles/ISaleQuestion";
import { SellerSaleInquiriesController } from "./SellerSaleInquiriesController";

@nest.Controller("sellers/:section/sales/:saleId/questions")
export class SellerSaleQuestionsController 
    extends SellerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent>
{
}