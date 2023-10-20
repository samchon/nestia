import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { ISwagger } from "../../../../api/structures/ISwagger";

export const test_api_swagger_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: ISwagger;
    }> = await api.functional.swagger.get(
        connection,
    );
    typia.assert(output);
};