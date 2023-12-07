import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IDateDefined } from "../../../../api/structures/IDateDefined";

export const test_api_date_get = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IDateDefined> = await api.functional.date.get(
        connection,
    );
    typia.assert(output);
};