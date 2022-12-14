import * as nest from "@nestjs/common";
import typia from "typia";

import { ISaleQuestion } from "../api/structures/ISaleQuestion";
import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController extends SaleInquiriesController<
    ISaleQuestion.IContent,
    ISaleQuestion.IStore,
    ISaleQuestion
>({
    index: (input) => typia.assertStringify(input),
    at: (input) => typia.isStringify(input),
    assert: (input) => typia.assert(input),
}) {
    public constructor() {
        super((input) => ({
            id: 0,
            writer: "someone",
            contents: [
                {
                    id: "some-id",
                    title: input.title,
                    body: input.body,
                    files: input.files,
                    created_at: new Date().toString(),
                },
            ],
            answer: null,
            hit: 0,
            created_at: new Date().toString(),
        }));
    }
}
