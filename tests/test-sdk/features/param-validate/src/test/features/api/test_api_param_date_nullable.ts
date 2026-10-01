import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies api param date nullable through its generated consumer.
 *
 * Accepted date/null and adjacent malformed spelling run under this feature's
 * validate option, contrasting the ordinary param owner. Any rejection
 * satisfies the negative; exact HTTP/error details belong to other controls.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Under parameter validate mode, generated date_nullable must echo a formatted date, return null for null and reject20140102.
 * @evidence contracts/testing.md#independent-expectations The explicit submitted valid date/null and authored tagged nullable date type establish expected behavior independently of validate-mode output. The malformed date has no required separators.
 * @evidence contracts/testing.md#distinguishing-cases Accepted date/null and adjacent malformed spelling run under this feature's validate option, contrasting the ordinary param owner. Any rejection satisfies the negative; exact HTTP/error details belong to other controls.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual validate-mode native parameter extraction, generated path encoding and HTTP handler must connect; ordinary assertion-mode success cannot certify this option.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_param_date_nullable = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = random();
  const value = await api.functional.param.date_nullable(connection, date);
  TestValidator.equals("date", date, value);

  TestValidator.equals(
    "null",
    await api.functional.param.date_nullable(connection, null),
    null,
  );

  await TestValidator.error("invalid", () =>
    api.functional.param.date_nullable(connection, "20140102"),
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
