import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IQueryQuery } from "../../oracle/query/structures/IQueryQuery";

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
 * @evidence contracts/testing.md#behavioral-verification Generated raw-Nest query request with stringified numeric/boolean values and three repeated strings must return the exact typed input and IQueryQuery shape.
 * @evidence contracts/testing.md#independent-expectations The authored Nest-query handler explicitly converts Number and true/null spellings, and submitted limit10/true/atomic/a-b-c supply independent expected values.
 * @evidence contracts/testing.md#distinguishing-cases Native Nest @Query string input contrasts TypedQuery object parsing. This case exercises present values and does not establish absent/false/null conversion branches.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Generated query encoding, Nest string parsing and authored conversion must connect over HTTP; direct Number/boolean expression units cannot prove request argument decoding.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_query_api_query_nest = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQueryQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQueryQuery = await api.functional.query.query.nest(
    connection,
    {
      limit: input.limit ? `${input.limit}` : undefined,
      enforce: input.enforce ? "true" : "false",
      atomic: input.atomic ? input.atomic : "null",
      values: input.values ?? [],
    },
  );
  typia.assertEquals(result);
  TestValidator.equals("nest", input, result);
};
