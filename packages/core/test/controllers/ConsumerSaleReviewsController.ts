import * as nest from "@nestjs/common";
import typia from "typia";

import { ISaleReview } from "../api/structures/ISaleReview";
import { SaleInquiriesController } from "./SaleInquiriesController";

@nest.Controller("consumers/:section/sales/:saleId/reviews")
export class ConsumerSaleReviewsController extends SaleInquiriesController<
    ISaleReview.IContent,
    ISaleReview.IStore,
    ISaleReview
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
                    score: input.score,
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
