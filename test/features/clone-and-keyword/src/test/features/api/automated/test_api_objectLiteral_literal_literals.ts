import typia from "typia";
import type { Format } from "typia/lib/tags/Format";
import type { Type } from "typia/lib/tags/Type";

import api from "../../../../api";

export const test_api_objectLiteral_literal_literals = async (
  connection: api.IConnection,
) => {
  const output: {
    id: string;
    member: {
      id: string & Format<"uuid">;
      email: string & Format<"email">;
      age: number & Type<"uint32">;
    };
    created_at: string & Format<"date-time">;
  }[] = await api.functional.objectLiteral.literal.literals(connection);
  typia.assert(output);
};
