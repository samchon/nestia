import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies api query composite through its generated consumer.
 *
 * Separately named scalar plus object parameters contrast ordinary typed-object
 * query under decompose:true. Both repeated values must survive; no invalid
 * input is submitted by this case.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated composite with atomic plus explicit limit10/enforce:true/two values must return exactly the combined query object and exact IQuery shape.
 * @evidence contracts/testing.md#independent-expectations The authored composite handler merges query with its separately named atomic parameter. Handwritten submitted fields and their merged object independently establish the expected response.
 * @evidence contracts/testing.md#distinguishing-cases Separately named scalar plus object parameters contrast ordinary typed-object query under decompose:true. Both repeated values must survive; no invalid input is submitted by this case.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated scalar/object query encoding and handler merge must connect over HTTP; Swagger decomposition alone cannot prove runtime argument mapping.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_query_composite = async (
  connection: api.IConnection,
): Promise<void> => {
  const atomic: string = "atomic";
  const input: Omit<IQuery, "atomic"> = {
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: IQuery = await api.functional.query.composite(
    connection,
    atomic,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("composite", result, {
    ...input,
    atomic,
  });
};
