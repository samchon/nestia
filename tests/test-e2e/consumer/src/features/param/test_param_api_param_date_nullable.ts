import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies api param date nullable through its generated consumer.
 *
 * Valid formatted date, nullable literal and one malformed spelling retain
 * three branches. The negative accepts any rejection and does not independently
 * establish400 or all invalid calendar dates.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated date_nullable must echo a formatted valid date and return exact null for null, while20140102 must reject.
 * @evidence contracts/testing.md#independent-expectations The submitted formatted date/null are independent echo expectations, and the authored tagged nullable date type rejects a compact unseparated date. Random calendar generation is a valid-input source, not the returned-value oracle.
 * @evidence contracts/testing.md#distinguishing-cases Valid formatted date, nullable literal and one malformed spelling retain three branches. The negative accepts any rejection and does not independently establish400 or all invalid calendar dates.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated path encoding, TypedParam nullable/date validation and handler serialization must connect over HTTP; a date-string validator unit cannot certify null path decoding.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_param_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = random();
  const value = await api.functional.param.param.date_nullable(
    connection,
    date,
  );
  TestValidator.equals("date", date, value!);

  TestValidator.equals(
    "null",
    await api.functional.param.param.date_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.param.date_nullable(connection, "20140102"),
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
