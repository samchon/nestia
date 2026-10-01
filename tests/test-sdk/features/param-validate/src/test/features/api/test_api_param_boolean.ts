import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies boolean path spellings are decoded precisely.
 *
 * This exercises the param-validate feature's generated transport and authored
 * handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated boolean route must echo false, decode 0 as false and 1 as true, and reject 2 and malformed text with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The supported HTTP boolean caster accepts false/true and zero/one spellings; the handwritten handler returns that cast value.
 * @evidence contracts/testing.md#distinguishing-cases False, zero and one contrast the adjacent out-of-range numeric spelling two and unrelated text; literal false echo strengthens the former shape-only assertion.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_param_boolean = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: boolean = await api.functional.param.boolean(connection, false);
  typia.assert(value);
  TestValidator.equals("false echo", value, false);

  TestValidator.equals(
    "false",
    false,
    await api.functional.param.boolean(connection, 0 as any),
  );
  TestValidator.equals(
    "true",
    true,
    await api.functional.param.boolean(connection, 1 as any),
  );

  await TestValidator.httpError("number", 400, () =>
    api.functional.param.boolean(connection, 2 as any),
  );
  await TestValidator.httpError("string", 400, () =>
    api.functional.param.boolean(connection, "string" as any),
  );
};
