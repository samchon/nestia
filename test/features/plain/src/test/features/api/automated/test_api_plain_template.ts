import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";

export const test_api_plain_template = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = await api.functional.plain.template(
        connection,
        typia.random<Primitive<`something_${number}_interesting_${string}_is_not_false_it?` | `something_${number}_interesting_${string}_is_not_true_it?`>>(),
    );
    typia.assert(output);
};