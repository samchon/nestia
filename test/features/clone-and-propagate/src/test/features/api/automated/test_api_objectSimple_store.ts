import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectSimple } from "../../../../api/structures/ObjectSimple";

export const test_api_objectSimple_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: ObjectSimple.IBox3D;
    }> = await api.functional.objectSimple.store(
        connection,
        typia.random<Primitive<ObjectSimple.IBox3D>>(),
    );
    typia.assert(output);
};