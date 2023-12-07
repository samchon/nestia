import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IToken } from "../../../../api/structures/IToken";

export const test_api_basic = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IToken> = await api.functional.basic(
        connection,
    );
    typia.assert(output);
};