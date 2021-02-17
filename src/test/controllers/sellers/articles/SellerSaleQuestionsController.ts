import * as nest from "@nestjs/common";

import { SellerSaleInquiriesController } from "./SellerSaleInquiriesController";
import { ISaleQuestion } from "../../../../../api/structures/sales/articles/ISaleQuestion";

@nest.Controller("sellers/:section/sales/:saleId/questions")
export class SellerSaleQuestionsController 
    extends SellerSaleInquiriesController<
        ISaleQuestion.IRequest,
        ISaleQuestion.ISummary,
        ISaleQuestion.IContent>
{
}