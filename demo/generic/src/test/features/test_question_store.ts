import api from "@api";
import { ISaleQuestion } from "@api/structures/ISaleQuestion";
import TSON from "typescript-json";

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
    TSON.assert(question);
}
