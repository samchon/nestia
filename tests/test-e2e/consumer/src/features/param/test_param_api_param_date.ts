import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies a date path value is preserved and malformed dates fail.
 *
 * This exercises the param feature's generated transport and authored handler.
 *
 * 1. Send the authored valid or malformed arguments through the generated request.
 * 2. Await completion and compare the payload or rejection with the independent
 *    contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated date route must echo the submitted ISO date and reject null and compact 20140102 with HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored date-tagged string contract requires the dashed date representation and the handler returns it unchanged; the submitted date is an independent echo oracle.
 * @evidence contracts/testing.md#distinguishing-cases A fresh valid date contrasts null and a one-format-change compact date. Exact status strengthens the former generic rejection checks.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_param_api_param_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = random();
  const value = await api.functional.param.param.date(connection, date);
  TestValidator.equals("date", date, value);

  await TestValidator.httpError("null", 400, () =>
    api.functional.param.param.date(connection, null!),
  );
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.param.param.date(connection, "20140102"),
  );
};

const random = () => {
  const date: Date = new Date(Math.floor(Math.random() * Date.now() * 2));
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
};
