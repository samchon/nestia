import api from "@api";
import { ISaleReview } from "@api/structures/ISaleReview";
import TSON from "typescript-json";

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
    TSON.assert(question);

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
                        name: "typescript-json",
                        extension: "lnk",
                        url: "https://github.com/samchon/typescript-json",
                    },
                ],
                extension: "html",
                score: 90,
            },
        );
    TSON.assert(updated);
}
