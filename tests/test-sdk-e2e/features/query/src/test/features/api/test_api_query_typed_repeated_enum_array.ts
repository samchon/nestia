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
 * @evidence contracts/testing.md#behavioral-verification Generated tagged enum-array query must return exactly COMPANY then KENNITALA, retaining both members/order and exact DTO shape.
 * @evidence contracts/testing.md#independent-expectations Handwritten enum values and authored echo handler independently establish the expected repeated array. MinItems1 is declared in the DTO; the two-member request specifically distinguishes getAll from get.
 * @evidence contracts/testing.md#distinguishing-cases Tagged enum intersection plus repeated values contrasts a scalar enum. The case does not submit empty/invalid enum input, and its exact array equality prevents first-value-only acceptance.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated repeated-key encoding and native tagged-array HTTP decoding must connect; a local enum validator cannot certify all wire occurrences are collected.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
