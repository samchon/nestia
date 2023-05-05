import typia, { Primitive } from "typia";

import api from "./../../../../api";

export const test_api_param_nullable = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<null | string> = 
        await api.functional.param.nullable(
            connection,
            typia.random<Primitive<null | string>>(),
        );
    typia.assert(output);
};