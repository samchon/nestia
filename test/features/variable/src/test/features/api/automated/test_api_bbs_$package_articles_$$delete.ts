import typia, { Primitive } from "typia";

import api from "./../../../../api";

export const test_api_bbs_$package_articles_$$delete = async (
    connection: api.IConnection
): Promise<void> => {
    await api.functional.bbs.$package.articles.$$delete(
        connection,
        typia.random<Primitive<string>>(),
        uuid(),
    );
};

const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });