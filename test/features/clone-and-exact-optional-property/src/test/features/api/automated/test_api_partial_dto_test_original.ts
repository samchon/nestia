import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IOriginal } from "../../../../api/structures/IOriginal";

export const test_api_partial_dto_test_original = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        200: IOriginal;
    }> = await api.functional.partial_dto_test.original(
        connection,
    );
    typia.assert(output);
};