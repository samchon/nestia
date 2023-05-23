import typia, { Primitive } from "typia";

import api from "./../../../../api";

export const test_api_param_date_nullable = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<null | string> = 
        await api.functional.param.date_nullable(
            connection,
            Math.random() < .2 ? null : date(),
        );
    typia.assert(output);
};

const date = (): string => {
    const date: Date = new Date(Math.floor(Math.random() * Date.now() * 2));
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, "0"),
        date.getDate().toString().padStart(2, "0"),
    ].join("-");
}