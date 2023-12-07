import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectSimple } from "../../../../api/structures/ObjectSimple";

export const test_api_objectSimple_index = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: Array<ObjectSimple.IBox3D>;
    }> = await api.functional.objectSimple.index(
        connection,
    );
    typia.assert(output);
};