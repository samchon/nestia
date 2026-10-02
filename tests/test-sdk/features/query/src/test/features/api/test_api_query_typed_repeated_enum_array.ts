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
 *
 * @evidence contracts/testing.md#behavioral-verification COMPANY and KENNITALA must both return in order, distinguishing getAll from a first-value-only decoder.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: COMPANY and KENNITALA must both return in order, distinguishing getAll from a first-value-only decoder.
 * @evidence contracts/testing.md#distinguishing-cases COMPANY and KENNITALA must both return in order, distinguishing getAll from a first-value-only decoder.
 * @evidence contracts/testing.md#execution-ownership The query installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary SDK repeated query serialization must reach the tagged native array decoder intact.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_typed_repeated_enum_array = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IBusinessListingFilters = {
    sellingType: ["COMPANY", "KENNITALA"],
  };
  const result: IBusinessListingFilters =
    await api.functional.query.typed_enum_array.typedEnumArray(
      connection,
      input,
    );

  typia.assertEquals(result);
  TestValidator.equals("typed repeated enum array", input, result);
};
