import typia from "typia";

import api from "../../../../api";
import type { IToken } from "../../../../api/structures/IToken";

export const test_api_security = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.security(
        connection,
    );
    typia.assert(output);
};