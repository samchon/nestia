import type { Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr } from "../../../../api/structures/PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr";

export const test_api_partial_dto_test_partial_type_partialType = async (
    connection: api.IConnection
): Promise<void> => {
    const output = await api.functional.partial_dto_test.partial_type.partialType(
        connection,
        typia.random<Primitive<PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr>>(),
    );
    typia.assert(output);
};