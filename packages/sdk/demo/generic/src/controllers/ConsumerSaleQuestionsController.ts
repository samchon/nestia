import { ISaleQuestion } from "@api/structures/ISaleQuestion";
import * as nest from "@nestjs/common";

import typia from "typia";

import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController extends SaleInquiriesController<
    ISaleQuestion.IContent,
    ISaleQuestion.IStore,
    ISaleQuestion
>({
    assert: (input) => typia.assert(input),
    stringify: (input) => typia.stringify(input),
    convert: (input) => ({
        id: 0,
        hit: 0,
        writer: "someone",
        answer: null,
        created_at: new Date().toString(),
        contents: [
            {
                id: "some-content-id",
                title: input.title,
                body: input.body,
                extension: input.extension,
                files: input.files,
                created_at: new Date().toString(),
            },
        ],
    }),
}) {}
