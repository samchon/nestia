import typia from "typia";

import api from "../api";
import { ISaleReview } from "../api/structures/ISaleReview";

export async function test_review(connection: api.IConnection): Promise<void> {
    const review: ISaleReview =
        await api.functional.consumers.sales.reviews.store(
            connection,
            "generla",
            "sale-id",
            {
                title: "some-title",
                body: "some-body",
                score: 100,
                files: [],
            },
        );
    typia.assert<typeof review>(review);
}
