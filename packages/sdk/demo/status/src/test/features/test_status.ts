import typia from "typia";

import api from "../../api";

export async function test_status(connection: api.IConnection): Promise<void> {
    const status = await api.functional.status(connection);
    typia.assert(status);
}
