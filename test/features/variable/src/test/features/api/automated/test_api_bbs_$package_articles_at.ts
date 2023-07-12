import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_bbs_$package_articles_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IBbsArticle> = 
        await api.functional.bbs.$package.articles.at(
            connection,
            typia.random<Primitive<string>>(),
            Math.random() < .2 ? null : uuid(),
        );
    typia.assert(output);
};

const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });