import type { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../../api";
import type { PartialPickIOriginalbemailcreated_atoriginal_optionalundefinable_attr } from "../../../../api/structures/PartialPickIOriginalbemailcreated_atoriginal_optionalundefinable_attr";

export const test_api_partial_dto_test_partial_type_partialType = async (
  connection: api.IConnection,
) => {
  const output: IPropagation<
    {
      201: PartialPickIOriginalbemailcreated_atoriginal_optionalundefinable_attr;
    },
    201
  > = await api.functional.partial_dto_test.partial_type.partialType(
    connection,
    typia.random<api.functional.partial_dto_test.partial_type.partialType.Body>(),
  );
  typia.assert(output);
};
