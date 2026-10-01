import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

/**
 * Verifies a nullable UUID path preserves both UUID and null.
 *
 * This exercises the param-validate feature's generated transport and authored
 * handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated nullable UUID route must echo a valid UUID, return null for null and reject short 12345678 with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored nullable UUID union explicitly admits null while retaining UUID format constraints for strings; literal submitted values establish expectations.
 * @evidence contracts/testing.md#distinguishing-cases A valid UUID and null positive contrast the malformed short-string negative and the nonnullable UUID case. Exact status strengthens the former generic rejection.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_param_uuid_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid_nullable(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  TestValidator.equals(
    "null",
    await api.functional.param.uuid_nullable(connection, null),
    null,
  );

  await TestValidator.httpError("invalid", 400, () =>
    api.functional.param.uuid_nullable(connection, "12345678"),
  );
};
