import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IDateDefinedDate } from "../../oracle/date/structures/IDateDefinedDate";

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
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects native Date metadata, route serializer, HTTP JSON and generated Primitive response decoding. An in-process Date.toJSON call cannot prove all four declared forms reach the generated response correctly.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage Every original literal/tag identity, verdict input, parameter flag, schema key, shape or alias request remains. Independent bigint/date checks strengthen selected shared-oracle/shape-only assertions; related clone and routing scenarios retain their separate executable owners.
 */
export const test_date_api_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date: typia.Primitive<IDateDefinedDate> =
    await api.functional.date.date.get(connection);
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
