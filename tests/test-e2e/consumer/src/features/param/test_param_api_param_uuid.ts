import { TestValidator } from "@nestia/e2e";
import { v4 } from "uuid";

import api from "../../api";

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
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_param_api_param_uuid = async (
  connection: api.IConnection,
): Promise<void> => {
  const uuid = v4();
  const value = await api.functional.param.param.uuid(connection, uuid);
  TestValidator.equals("uuid", uuid, value);

  await TestValidator.httpError("null", 400, () =>
    api.functional.param.param.uuid(connection, null!),
  );
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.param.param.uuid(connection, "12345678"),
  );
};
