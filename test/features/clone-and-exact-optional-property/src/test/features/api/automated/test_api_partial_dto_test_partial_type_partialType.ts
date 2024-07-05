import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb } from "../../../../api/structures/PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb";
import type { PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrd } from "../../../../api/structures/PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrd";

export const test_api_partial_dto_test_partial_type_partialType = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<{
    201: PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrb;
  }> = await api.functional.partial_dto_test.partial_type.partialType(
    connection,
    typia.random<PartialPickIOriginalemailcreated_atoriginal_optionalundefinable_attrd>(),
  );
  typia.assert(output);
};
