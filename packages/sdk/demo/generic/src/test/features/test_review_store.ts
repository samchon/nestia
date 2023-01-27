import api from "@api";
import { ISaleReview } from "@api/structures/ISaleReview";

import typia from "typia";

export async function test_review_store(
    connection: api.IConnection,
): Promise<void> {
    const question: ISaleReview =
        await api.functional.consumers.sales.reviews.store(
            connection,
            "general",
            "some-sale-id",
            {
                title: "some-title",
                body: "some-body-content",
                files: [],
                extension: "html",
                score: 100,
            },
        );
    typia.assert(question);
}
