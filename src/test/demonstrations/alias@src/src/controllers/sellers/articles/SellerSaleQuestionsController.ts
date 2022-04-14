import * as nest from "@nestjs/common";

import { ISaleQuestion } from "@src/api/structures/sales/articles/ISaleQuestion";
import { SellerSaleInquiriesController } from "@src/controllers/sellers/articles/SellerSaleInquiriesController";

@nest.Controller("sellers/:section/sales/:saleId/questions")
export class SellerSaleQuestionsController 
    extends SellerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent>
{
}