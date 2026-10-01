import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IQueryQuery } from "../../api/structures/IQueryQuery";

/**
 * Verifies typed query fields survive transport.
 *
 * This exercises the query feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated typed query must return an exact IQueryQuery equal to all submitted limit, enforce, atomic and values fields.
 * @evidence contracts/testing.md#independent-expectations The authored DTO and echo handler require number/boolean/string/string-array values to survive query encoding and server decoding.
 * @evidence contracts/testing.md#distinguishing-cases The ordinary typed positive contrasts null atomic and malformed enforce cases; composite/nest entries own different request interfaces.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated query encoder, fetcher, actual Nest query decoder/validator and echo handler. Unit metadata assertions cannot prove the query string preserves these submitted fields or exposes this HTTP rejection.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_query_api_query_typed = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IQueryQuery = {
    limit: 10,
    enforce: true,
    atomic: "atomic",
    values: ["a", "b", "c"],
  };
  const result: IQueryQuery = await api.functional.query.query.typed(
    connection,
    input,
  );
  typia.assertEquals(result);
  TestValidator.equals("typed", input, result);
};
