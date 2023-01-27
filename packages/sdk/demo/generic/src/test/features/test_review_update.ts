import api from "@api";
import { ISaleReview } from "@api/structures/ISaleReview";

import typia from "typia";

export async function test_review_update(
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

    const updated: ISaleReview =
        await api.functional.consumers.sales.reviews.update(
            connection,
            "general",
            "some-sale-id",
            question.id,
            {
                title: "new-title",
                body: "new-content-body",
                files: [
                    {
                        name: "typia",
                        extension: "lnk",
                        url: "https://github.com/samchon/typia",
                    },
                ],
                extension: "html",
                score: 90,
            },
        );
    typia.assert(updated);
}
