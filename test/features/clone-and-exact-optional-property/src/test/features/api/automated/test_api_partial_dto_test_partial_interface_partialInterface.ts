import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { IOriginal } from "../../../../api/structures/IOriginal";
import type { IPartialInterface } from "../../../../api/structures/IPartialInterface";

export const test_api_partial_dto_test_partial_interface_partialInterface = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: IPartialInterface;
    }> = await api.functional.partial_dto_test.partial_interface.partialInterface(
        connection,
        typia.random<Primitive<IOriginal.IPartialInterface>>(),
    );
    typia.assert(output);
};