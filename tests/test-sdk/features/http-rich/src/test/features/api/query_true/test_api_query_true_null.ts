import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { QueryTrueIQuery } from "../../../../structures/query_true/QueryTrueIQuery";

/**
 * Verifies typed query serialization retains a nullable null field.
 *
 * Generated null serialization must agree with native TypedQuery null decoding.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the nullable atomic field must remain null alongside valid numeric,
 *    boolean and array neighbors rather than become omitted or textual null.
 *
 * @evidence contracts/testing.md#behavioral-verification Nullable atomic remains literal null while numeric, boolean and array neighbors round-trip unchanged. The freshly generated installed SDK calls the compiled authored route over HTTP.
 * @evidence contracts/testing.md#independent-expectations Literal authored inputs and the declared query extraction contract provide expected values; actual outputs are not used to create snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Nullable atomic remains literal null while numeric, boolean and array neighbors round-trip unchanged. The neighboring valid, invalid, scalar, composite, Nest and null cases remain separate executable owners in this same batch.
 * @evidence contracts/testing.md#execution-ownership This matching case is discovered by the installed shared HTTP consumer after one public producer and consumer compilation. It acquires no per-case compiler, backend or install.
 * @evidence contracts/e2e.md#necessary-boundary Fresh SDK query encoding, Nest extraction and native TypedQuery validation must agree over the actual HTTP connection; direct serializer calls cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution The common installed artifact graph, producer, generation, consumer and application serve all transferred query cases; no query feature lifecycle executes separately.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query controller is stateless and uses unique class, route and DTO identities. Cases use authored requests and literal expectations; the shared runner owns host and output cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Every original request, typia assertion, exact equality or awaited HTTP400 assertion remains after reversible import, accessor and case identity edits.
 */
export const test_api_query_true_null = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: QueryTrueIQuery = {
    limit: 10,
    enforce: true,
    atomic: null,
    values: ["a", "b", "c"],
  };
  const result: QueryTrueIQuery =
    await api.functional.http_rich.query_true.typed(connection, input);
  typia.assertEquals(result);
  TestValidator.equals("null", input, result);
};
