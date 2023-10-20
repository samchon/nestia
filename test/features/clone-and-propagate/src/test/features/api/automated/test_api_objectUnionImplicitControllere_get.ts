import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectUnionImplicit } from "../../../../api/structures/ObjectUnionImplicit";

export const test_api_objectUnionImplicitControllere_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ObjectUnionImplicit;
    }> = await api.functional.objectUnionImplicitControllere.get(
        connection,
    );
    typia.assert(output);
};