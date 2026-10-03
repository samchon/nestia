import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";

/**
 * Verifies a named scalar query parameter echoes its exact value.
 *
 * Generated scalar query naming must match the controller Query id field over
 * HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored some-value text must survive query encoding and named
 *    Query extraction unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification The named id query field returns the exact some-value literal and passes its string type assertion. The freshly generated installed SDK calls the compiled authored route over HTTP.
 * @evidence contracts/testing.md#independent-expectations Literal authored inputs and the declared query extraction contract provide expected values; actual outputs are not used to create snapshots.
 * @evidence contracts/testing.md#distinguishing-cases The named id query field returns the exact some-value literal and passes its string type assertion. The neighboring valid, invalid, scalar, composite, Nest and null cases remain separate executable owners in this same batch.
 * @evidence contracts/testing.md#execution-ownership This matching case is discovered by the installed shared HTTP consumer after one public producer and consumer compilation. It acquires no per-case compiler, backend or install.
 * @evidence contracts/e2e.md#necessary-boundary Fresh SDK query encoding, named Nest Query extraction and native TypedRoute response serialization must agree over HTTP; this route does not use TypedQuery validation and direct serializer calls cannot establish their connection.
 * @evidence contracts/e2e.md#shared-execution The common installed artifact graph, producer, generation, consumer and application serve all transferred query cases; no query feature lifecycle executes separately.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query controller is stateless and uses unique class, route and DTO identities. Cases use authored requests and literal expectations; the shared runner owns host and output cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Every original request, typia assertion, exact equality or awaited HTTP400 assertion remains after reversible import, accessor and case identity edits.
 */
export const test_api_query_true_individual = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: string = "some-value";
  const value: string = await api.functional.http_rich.query_true.individual(
    connection,
    "some-value",
  );
  typia.assertEquals(value);
  TestValidator.equals("individual", input, value);
};
