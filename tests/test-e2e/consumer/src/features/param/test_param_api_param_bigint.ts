import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";

/**
 * Verifies a bigint path parameter is converted correctly.
 *
 * This exercises the param feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated bigint route must return numeric one for BigInt(1), while boolean true and malformed text reject with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored handler returns Number(value); conversion of bigint one is exactly one, and boolean/text paths violate its bigint input contract.
 * @evidence contracts/testing.md#distinguishing-cases A valid bigint value and two adjacent wrong representations distinguish conversion from broad acceptance; exact returned one strengthens the former shape-only positive.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_param_api_param_bigint = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: number = await api.functional.param.param.bigint(
    connection,
    BigInt(1),
  );
  typia.assert(value);
  TestValidator.equals("echo", value, 1);

  await TestValidator.httpError("boolean", 400, () =>
    api.functional.param.param.bigint(connection, true as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.param.bigint(connection, "string" as any),
  );
};
