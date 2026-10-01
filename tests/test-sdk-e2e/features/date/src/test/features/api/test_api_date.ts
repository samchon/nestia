import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IDateDefined } from "@api/lib/structures/IDateDefined";

/**
 * Verifies api date through its generated consumer.
 *
 * The authored DTO and handler supply the observable response contract.
 *
 * 1. Send the retained request through the generated SDK.
 * 2. Validate the response shape or independent payload invariant.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated date request must return the exact Primitive date DTO shape and all four selected values must be strings equal to their canonical ISO date roundtrip.
 * @evidence contracts/testing.md#independent-expectations Authored DateController returns an ISO string and actual Date instances, including a Date-or-Buffer declaration whose runtime value is Date. Date JSON serialization produces canonical ISO strings; that independent contract strengthens a generated-type-only shape oracle.
 * @evidence contracts/testing.md#distinguishing-cases String, untagged Date, tagged Date and Date in a native union all run. This case checks the Date-selected union branch, not Buffer transport or exact wall-clock values.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects native Date metadata, route serializer, HTTP JSON and generated Primitive response decoding. An in-process Date.toJSON call cannot prove all four declared forms reach the generated response correctly.
 * @evidence contracts/e2e.md#shared-execution Packed packages and compatible producer/runtime compilations are shared. These assertions start no independent installation/compiler; sibling transport cases reuse the feature backend, while distinct CLI/file-pattern boundaries retain their own lifetimes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored inputs and generated outputs belong to isolated feature trees; values are local and output reads are immutable. The entry rejects empty discovery and finally closes its backend; harness cleanup waits for consuming children before releasing owned trees.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
 */
export const test_api_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date: typia.Primitive<IDateDefined> =
    await api.functional.date.get(connection);
  typia.assertEquals(date);
  for (const value of [
    date.string,
    date.date,
    date.date_with_tag,
    date.date_but_union,
  ]) {
    if (typeof value !== "string")
      throw new Error("The Date-selected response must be an ISO string.");
    TestValidator.equals(
      "canonical ISO date",
      new Date(value).toISOString(),
      value,
    );
  }
};
