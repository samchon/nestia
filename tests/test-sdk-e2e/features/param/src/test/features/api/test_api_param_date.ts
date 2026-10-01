import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this matching exported function and awaits it against the generated SDK and its actual backend after generation; its cases belong to E2E, not portable transformer unit selection.
 * @evidence contracts/e2e.md#necessary-boundary This connects the generated path encoder, fetcher, actual path caster/validator and echo handler. A direct predicate does not prove these spellings reach the route and its returned value/status is decoded correctly.
 * @evidence contracts/e2e.md#shared-execution The request shares its feature SDK/backend with sibling API cases and starts no installation, compiler or server. Compatible cohorts share CLI configuration loading and runtime programs; file-input reflection still compiles per configuration in the current canonical harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Submitted values are fresh or immutable literals and the echo handlers retain no shared mutable request state. The feature entry allocates its port and finally closes its backend after reports, discovery errors or failed startup; each negative is awaited before proceeding.
 * @evidence contracts/e2e.md#preserved-coverage All submitted values, positive/negative distinctions and generated calls remain executable in this feature. Literal echo and exact status checks strengthen broad shape/error assertions where changed; other parameter/query forms retain their neighboring owners.
 */
export const test_api_param_date = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = random();
  const value = await api.functional.param.date(connection, date);
  TestValidator.equals("date", date, value);

  await TestValidator.httpError("null", 400, () =>
    api.functional.param.date(connection, null!),
  );
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.param.date(connection, "20140102"),
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
