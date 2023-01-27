import api from "@api";
import { ISaleQuestion } from "@api/structures/ISaleQuestion";

import typia from "typia";

export async function test_question_store(
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
}
