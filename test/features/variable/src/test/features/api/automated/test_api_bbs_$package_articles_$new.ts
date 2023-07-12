import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_bbs_$package_articles_$new = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.bbs.$package.articles.$new(
            connection,
            typia.random<Primitive<string>>(),
            date(),
        );
    typia.assert(output);
};

const date = (): string => {
    const date: Date = new Date(Math.floor(Math.random() * Date.now() * 2));
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, "0"),
        date.getDate().toString().padStart(2, "0"),
    ].join("-");
}