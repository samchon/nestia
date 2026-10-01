import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IQuery } from "@api/lib/structures/IQuery";

/**
 * Verifies api query nest through its generated consumer.
 *
 * Native Nest @Query string input contrasts TypedQuery object parsing. This
 * case exercises present values and does not establish absent/false/null
 * conversion branches.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated raw-Nest query request with stringified numeric/boolean values and three repeated strings must return the exact typed input and IQuery shape.
 * @evidence contracts/testing.md#independent-expectations The authored Nest-query handler explicitly converts Number and true/null spellings, and submitted limit10/true/atomic/a-b-c supply independent expected values.
 * @evidence contracts/testing.md#distinguishing-cases Native Nest @Query string input contrasts TypedQuery object parsing. This case exercises present values and does not establish absent/false/null conversion branches.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated query encoding, Nest string parsing and authored conversion must connect over HTTP; direct Number/boolean expression units cannot prove request argument decoding.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQuery = await api.functional.query.nest(connection, {
    limit: input.limit ? `${input.limit}` : undefined,
    enforce: input.enforce ? "true" : "false",
    atomic: input.atomic ? input.atomic : "null",
    values: input.values ?? [],
  });
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
