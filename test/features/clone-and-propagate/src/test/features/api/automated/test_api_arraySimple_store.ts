import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ArraySimple } from "../../../../api/structures/ArraySimple";

export const test_api_arraySimple_store = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: ArraySimple.IPerson;
    }> = await api.functional.arraySimple.store(
        connection,
        typia.random<Primitive<ArraySimple.IPerson>>(),
    );
    typia.assert(output);
};