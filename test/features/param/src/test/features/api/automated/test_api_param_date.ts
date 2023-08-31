import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "./../../../../api";

export const test_api_param_date = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = 
        await api.functional.param.date(
            connection,
            date(),
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