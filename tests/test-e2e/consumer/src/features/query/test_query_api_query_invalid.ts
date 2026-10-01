import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a malformed query boolean is rejected.
 *
 * This exercises the query feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The awaited generated typed query with enforce something must reject with HTTP 400; silently accepting the string or leaving the rejection detached fails.
 * @evidence contracts/testing.md#independent-expectations The handwritten query DTO requires a boolean enforce value. The otherwise valid request differs only by an unsupported boolean spelling.
 * @evidence contracts/testing.md#distinguishing-cases The malformed boolean is the negative twin of typed/null valid requests; exact HTTP-error classification forbids unrelated exceptions as substitutes.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated query encoder, fetcher, actual Nest query decoder/validator and echo handler. Unit metadata assertions cannot prove the query string preserves these submitted fields or exposes this HTTP rejection.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_query_api_query_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.query.query.typed(connection, {
      limit: 10,
      enforce: "something" as any,
      values: ["a", "b", "c"],
      atomic: "atomic",
    }),
  );
};
