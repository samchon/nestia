import TSON from "typescript-json";
import * as nest from "@nestjs/common";

import { ISaleQuestion } from "@api/structures/ISaleQuestion";

import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/questions")
export class ConsumerSaleQuestionsController extends SaleInquiriesController<
    ISaleQuestion.IContent,
    ISaleQuestion.IStore,
    ISaleQuestion
>({
    assert: (input) => TSON.assert(input),
    stringify: (input) => TSON.stringify(input),
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
