import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBusinessListingFilters } from "@api/lib/structures/IBusinessListingFilters";

/**
 * Verifies @TypedQuery preserves repeated enum-array query parameters.
 *
 * Locks the native HTTP query decoder branch that must call
 * URLSearchParams.getAll for array DTO properties even when the array is
 * intersected with typia tags. A regression would collapse repeated
 * `sellingType` keys into only the first value and break multi-select filters.
 *
 * 1. Send a generated SDK request with two sellingType values.
 * 2. Let @TypedQuery parse the repeated query keys into the tagged enum array.
 * 3. Assert both values are returned as an array in request order.
 */
export const test_api_query_typed_repeated_enum_array = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBusinessListingFilters = {
    sellingType: ["COMPANY", "KENNITALA"],
  };
  const result: IBusinessListingFilters =
    await api.functional.query.typed_enum_array(connection, input);

  typia.assertEquals(result);
  TestValidator.equals("typed repeated enum array", input, result);
};
