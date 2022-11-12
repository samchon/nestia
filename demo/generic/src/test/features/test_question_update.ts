import api from "@api";
import { ISaleQuestion } from "@api/structures/ISaleQuestion";
import TSON from "typescript-json";

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
    TSON.assert(question);

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
                        name: "typescript-json",
                        extension: "lnk",
                        url: "https://github.com/samchon/typescript-json",
                    },
                ],
                extension: "html",
            },
        );
    TSON.assert(updated);
}
