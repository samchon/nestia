import typia, { Primitive } from "typia";

import api from "./../../../../api";
import type { IBbsArticle } from "./../../../../api/structures/IBbsArticle";

export const test_api_headers_update = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.headers.update(
        connection,
        typia.random<Primitive<string>>(),
        uuid(),
        typia.random<Primitive<IBbsArticle.IStore>>(),
    );
};

const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });