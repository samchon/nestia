import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IBusinessListingFiltersQuery } from "../../oracle/query/structures/IBusinessListingFiltersQuery";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Generated tagged enum-array query must return exactly COMPANY then KENNITALA, retaining both members/order and exact DTO shape.
 * @evidence contracts/testing.md#independent-expectations Handwritten enum values and authored echo handler independently establish the expected repeated array. MinItems1 is declared in the DTO; the two-member request specifically distinguishes getAll from get.
 * @evidence contracts/testing.md#distinguishing-cases Tagged enum intersection plus repeated values contrasts a scalar enum. The case does not submit empty/invalid enum input, and its exact array equality prevents first-value-only acceptance.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Generated repeated-key encoding and native tagged-array HTTP decoding must connect; a local enum validator cannot certify all wire occurrences are collected.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_query_api_query_typed_repeated_enum_array = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBusinessListingFiltersQuery = {
    sellingType: ["COMPANY", "KENNITALA"],
  };
  const result: IBusinessListingFiltersQuery =
    await api.functional.query.query.typed_enum_array.typedEnumArray(
      connection,
      input,
    );

  typia.assertEquals(result);
  TestValidator.equals("typed repeated enum array", input, result);
};
