import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IOriginal } from "../../../../api/structures/IOriginal";

export const test_api_partial_dto_test_partial_interface_partialInterface = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.partial_dto_test.partial_interface.partialInterface(
        connection,
        typia.random<Primitive<IOriginal.IPartialInterface>>(),
    );
    typia.assert(output);
};