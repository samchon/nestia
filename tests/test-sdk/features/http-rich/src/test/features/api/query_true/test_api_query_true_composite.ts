import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { QueryTrueIQuery } from "../../../../structures/query_true/QueryTrueIQuery";

/**
 * Verifies a named scalar query and a DTO query combine without losing either.
 *
 * Generated query-field and DTO argument serialization must reach their
 * distinct controller parameters.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the independent expected object combines atomic with the supplied
 *    limit, enforce and two values, retaining all declared fields.
 *
 * @evidence contracts/testing.md#behavioral-verification Separate atomic and DTO arguments combine into the exact authored object with array and optional numeric neighbors. The freshly generated installed SDK calls the compiled authored route over HTTP.
 * @evidence contracts/testing.md#independent-expectations Literal authored inputs and the declared query extraction contract provide expected values; actual outputs are not used to create snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Separate atomic and DTO arguments combine into the exact authored object with array and optional numeric neighbors. The neighboring valid, invalid, scalar, composite, Nest and null cases remain separate executable owners in this same batch.
 * @evidence contracts/testing.md#execution-ownership This matching case is discovered by the installed shared HTTP consumer after one public producer and consumer compilation. It acquires no per-case compiler, backend or install.
 * @evidence contracts/e2e.md#necessary-boundary Fresh SDK query encoding, Nest extraction and native TypedQuery validation must agree over the actual HTTP connection; direct serializer calls cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution The common installed artifact graph, producer, generation, consumer and application serve all transferred query cases; no query feature lifecycle executes separately.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query controller is stateless and uses unique class, route and DTO identities. Cases use authored requests and literal expectations; the shared runner owns host and output cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Every original request, typia assertion, exact equality or awaited HTTP400 assertion remains after reversible import, accessor and case identity edits.
 */
export const test_api_query_true_composite = async (
  connection: api.IConnection,
): Promise<void> => {
  const atomic: string = "atomic";
  const input: Omit<QueryTrueIQuery, "atomic"> = {
    limit: 10,
    enforce: true,
    values: ["value-1", "value-2"],
  };
  const result: QueryTrueIQuery =
    await api.functional.http_rich.query_true.composite(
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
