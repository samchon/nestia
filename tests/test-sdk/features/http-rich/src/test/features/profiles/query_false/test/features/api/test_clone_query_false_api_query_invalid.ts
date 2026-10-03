import { TestValidator } from "@nestia/e2e";

import api from "../../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The original generated SDK invocation and exact echoed DTO or HTTP400 assertion exercise query encoding and the compiled handler.
 * @evidence contracts/testing.md#independent-expectations Authored DTO fields, literal wire values and OpenAPI format requirements establish the preserved expectations independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases This original case retains its complete valid, optional, nullable, malformed or version-specific inputs and assertion branches; the other eight cases retain complementary distinctions.
 * @evidence contracts/testing.md#execution-ownership The matching authored export is discovered in the shared installed consumer profile; direct unit populations remain separate.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated query serialization and native TypedQuery or plain Nest Query parsing must agree across HTTP.
 * @evidence contracts/e2e.md#shared-execution The two necessary document versions share installation, authored producer, consumer compilation and one listener; the Swagger2 profile generates no SDK or automated tests.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route, controller and DTO identities isolate these stateless handlers. Each document version has its own output and all authored calls share only immutable artifacts.
 * @evidence contracts/e2e.md#preserved-coverage All original invocation and assertion bodies remain after reversible names, imports, route identities and document locations; no additional random generated calls are introduced.
 */
export const test_clone_query_false_api_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.http_rich.options.query_false.query.typed(connection, {
      limit: 10,
      enforce: "something" as any,
      values: ["a", "b", "c"],
      atomic: "atomic",
    }),
  );
};
