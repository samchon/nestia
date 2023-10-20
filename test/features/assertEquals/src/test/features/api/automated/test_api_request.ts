import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IRequestDto } from "../../../../api/structures/IRequestDto";

export const test_api_request = async (
    connection: api.IConnection
): Promise<void> => {
    const output: Primitive<IRequestDto> = await api.functional.request(
        connection,
        typia.random<Primitive<IRequestDto>>(),
    );
    typia.assert(output);
};