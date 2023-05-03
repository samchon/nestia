import typia, { Primitive } from "typia";

import api from "./../../../../api";

export const test_api_param_string = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = 
        await api.functional.param.string(
            connection,
            typia.random<Primitive<string>>(),
        );
    typia.assert(output);
};