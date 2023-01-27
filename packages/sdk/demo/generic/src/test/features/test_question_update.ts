import api from "@api";
import { ISaleQuestion } from "@api/structures/ISaleQuestion";

import typia from "typia";

export async function test_question_update(
    connection: api.IConnection,
): Promise<void> {
    const question: ISaleQuestion =
        await api.functional.consumers.sales.questions.store(
            connection,
            "general",
            "some-sale-id",
            {
                title: "some-title",
                body: "some-body-content",
                files: [],
                extension: "html",
            },
        );
    typia.assert(question);

    const updated: ISaleQuestion =
        await api.functional.consumers.sales.questions.update(
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
            },
        );
    typia.assert(updated);
}
