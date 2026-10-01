import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";

/**
 * Verifies boolean path spellings are decoded precisely.
 *
 * This exercises the param feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated boolean route must echo false, decode 0 as false and 1 as true, and reject 2 and malformed text with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The supported HTTP boolean caster accepts false/true and zero/one spellings; the handwritten handler returns that cast value.
 * @evidence contracts/testing.md#distinguishing-cases False, zero and one contrast the adjacent out-of-range numeric spelling two and unrelated text; literal false echo strengthens the former shape-only assertion.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_param_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean = await api.functional.param.param.boolean(
    connection,
    false,
  );
  typia.assert(value);
  TestValidator.equals("false echo", value, false);

  TestValidator.equals(
    "false",
    false,
    await api.functional.param.param.boolean(connection, 0 as any),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.param.param.boolean(connection, 1 as any),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.param.param.boolean(connection, 2 as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.param.boolean(connection, "string" as any),
  );
};
