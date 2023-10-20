import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ObjectUnionExplicit } from "../../../../api/structures/ObjectUnionExplicit";

export const test_api_objectUnionExplicit_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ObjectUnionExplicit;
    }> = await api.functional.objectUnionExplicit.get(
        connection,
    );
    typia.assert(output);
};