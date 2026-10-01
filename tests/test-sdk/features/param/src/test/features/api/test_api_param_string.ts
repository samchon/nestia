import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

/**
 * Verifies a string path value is preserved.
 *
 * This exercises the param feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated string route must return a string exactly equal to the submitted string literal, not merely any string-shaped response.
 * @evidence contracts/testing.md#independent-expectations The handwritten route returns its string input unchanged; the submitted value independently establishes the expected result.
 * @evidence contracts/testing.md#distinguishing-cases This owns ordinary string echo; neighboring numeric/boolean/date/UUID tests own rejected representations under their narrower contracts.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_param_string = async (
  connection: api.IConnection,
): Promise<void> => {
  const value: string = await api.functional.param.string(connection, "string");
  typia.assert(value);
  TestValidator.equals("echo", value, "string");
};
