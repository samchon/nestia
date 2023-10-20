import type { IPropagation, Primitive } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr } from "../../../../api/structures/PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr";
import type { PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb } from "../../../../api/structures/PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb";

export const test_api_partial_dto_test_partial_type_partialType = async (
    connection: api.IConnection
): Promise<void> => {
    const output: IPropagation<{
        201: PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb;
    }> = await api.functional.partial_dto_test.partial_type.partialType(
        connection,
        typia.random<Primitive<PartialPickIOriginaldemailcreated_atoriginal_optionalundefinable_attr>>(),
    );
    typia.assert(output);
};