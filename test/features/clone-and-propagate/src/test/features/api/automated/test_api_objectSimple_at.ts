import type { IPropagation, Resolved } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectSimple } from "../../../../api/structures/ObjectSimple";

export const test_api_objectSimple_at = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ObjectSimple.IBox3D;
    }> = await api.functional.objectSimple.at(
        connection,
        typia.random<Resolved<number>>(),
    );
    typia.assert(output);
};