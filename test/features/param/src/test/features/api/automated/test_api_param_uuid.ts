import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "./../../../../api";

export const test_api_param_uuid = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<string> = 
        await api.functional.param.uuid(
            connection,
            uuid(),
        );
    typia.assert(output);
};

const uuid = (): string =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });