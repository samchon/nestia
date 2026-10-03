import { TestValidator } from "@nestia/e2e";

import api from "../../../../api";

/**
 * Verifies an invalid boolean query field rejects before the test completes.
 *
 * TypedQuery runtime rejection must arrive through the generated SDK as an HTTP
 * failure.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the enforce field alone changes from boolean to something while the
 *    other fields remain valid; the request must reject with HTTP 400 and its
 *    validator promise is awaited.
 *
 * @evidence contracts/testing.md#behavioral-verification Changing only enforce from a valid boolean to something rejects with awaited HTTP400 while the authored valid typed case remains accepted. The freshly generated installed SDK calls the compiled authored route over HTTP.
 * @evidence contracts/testing.md#independent-expectations Literal authored inputs and the declared query extraction contract provide expected values; actual outputs are not used to create snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Changing only enforce from a valid boolean to something rejects with awaited HTTP400 while the authored valid typed case remains accepted. The neighboring valid, invalid, scalar, composite, Nest and null cases remain separate executable owners in this same batch.
 * @evidence contracts/testing.md#execution-ownership This matching case is discovered by the installed shared HTTP consumer after one public producer and consumer compilation. It acquires no per-case compiler, backend or install.
 * @evidence contracts/e2e.md#necessary-boundary Fresh SDK query encoding, Nest extraction and native TypedQuery validation must agree over the actual HTTP connection; direct serializer calls cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution The common installed artifact graph, producer, generation, consumer and application serve all transferred query cases; no query feature lifecycle executes separately.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query controller is stateless and uses unique class, route and DTO identities. Cases use authored requests and literal expectations; the shared runner owns host and output cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Every original request, typia assertion, exact equality or awaited HTTP400 assertion remains after reversible import, accessor and case identity edits.
 */
export const test_api_query_true_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.http_rich.query_true.typed(connection, {
      limit: 10,
      enforce: "something" as any,
      values: ["a", "b", "c"],
      atomic: "atomic",
    }),
  );
};
