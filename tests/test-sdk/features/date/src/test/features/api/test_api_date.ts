import typia from "typia";

import api from "@api";
import { IDateDefined } from "@api/lib/structures/IDateDefined";

/**
 * Verifies calls date.get and validates Primitive<IDateDefined> response shape.
 *
 * The authored date DTO and typia Primitive JSON representation establish the
 * expected wire shape.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date: typia.Primitive<IDateDefined> =
    await api.functional.date.get(connection);
  typia.assertEquals(date);
};
