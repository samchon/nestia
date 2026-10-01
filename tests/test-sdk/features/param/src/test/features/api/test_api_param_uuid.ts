import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "@api";

/**
 * Verifies a UUID path value is preserved and invalid UUIDs fail.
 *
 * This exercises the param feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated UUID route must echo the submitted valid UUID and reject null and short 12345678 with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored UUID format tag excludes null and the short string; the handler echoes a valid submitted UUID independently of generated code.
 * @evidence contracts/testing.md#distinguishing-cases Valid UUID, missing/null and malformed-format neighbors retain distinct assertions; exact status strengthens the former generic rejection checks.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_param_uuid = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.uuid(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  await TestValidator.httpError("null", 400, () =>
    api.functional.param.uuid(connection, null!),
  );
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.param.uuid(connection, "12345678"),
  );
};
