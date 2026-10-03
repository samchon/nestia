import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { QueryFalseIQuery } from "../../../../../../../structures/query_false/IQuery";
import api from "../../../api";

/**
 * Verifies typed query scalar and array fields round-trip as their declared
 * DTO.
 *
 * Generated query encoding and TypedQuery validation meet over HTTP.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored limit, enforce, atomic and three values must echo exactly
 *    and satisfy QueryFalseIQuery with no extra fields.
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
export const test_clone_query_false_api_query_typed = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: QueryFalseIQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: QueryFalseIQuery =
    await api.functional.http_rich.options.query_false.query.typed(
      connection,
      input,
    );
  typia.assertEquals(result);
  TestValidator.equals("typed", input, result);
};
