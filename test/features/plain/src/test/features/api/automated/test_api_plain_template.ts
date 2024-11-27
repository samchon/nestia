import typia from "typia";
import type { Resolved } from "typia";

import api from "../../../../api";

export const test_api_plain_template = async (connection: api.IConnection) => {
  const output: Resolved<string> = await api.functional.plain.template(
    connection,
    typia.random<
      | `something_${number}_interesting_${string}_is_not_false_it?`
      | `something_${number}_interesting_${string}_is_not_true_it?`
    >(),
  );
  typia.assert(output);
};
