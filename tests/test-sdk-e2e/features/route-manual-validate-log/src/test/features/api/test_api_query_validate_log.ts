import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies `"stringify": "validate.log"` logs an invalid `@TypedQuery.Get()`
 * response and sends it, as it does a `@TypedRoute` JSON one.
 *
 * The querified responses had no `validate.log` mode: the transform took its
 * `assert` default, so the route answered 500 instead of logging (#1727).
 *
 * 1. Register a logger and fetch a route whose response has an invalid `id`.
 * 2. Assert it answers 200 with the querified body.
 * 3. Assert exactly one log entry names the method, path, and the error.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw invalid query response must stay200 with exact id=wrong-data&count=3 and produce exactly one GET /query log whose only error path is $input.id.
 * @evidence contracts/testing.md#independent-expectations The authored query handler deliberately supplies invalid UUID and count3; validate.log is documented to report while sending the response. Explicit encoded string and handwritten method/path independently establish expectations.
 * @evidence contracts/testing.md#distinguishing-cases Querified invalid output contrasts JSON article logging and ordinary validate-mode500. Exact count/body/error paths prevent default assert or silent pass from satisfying the selected log mode.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native query-response validator, querifier, HTTP status and public logging callback must connect; JSON-route logging alone cannot certify this separate serialization path.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The case owns its local logging callback and restores the documented default console.log in finally. The serial feature executor prevents overlapping logger ownership, and the entry/harness close the backend and owned copied tree after consumption.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_query_validate_log = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));
  try {
    const response: Response = await fetch(`${connection.host}/query`);
    TestValidator.equals("status", response.status, 200);
    TestValidator.equals(
      "body",
      await response.text(),
      "id=wrong-data&count=3",
    );
    TestValidator.equals("logs", logs.length, 1);
    TestValidator.equals("method", logs[0]?.method, "GET");
    TestValidator.equals("path", logs[0]?.path, "/query");
    TestValidator.equals(
      "error path",
      logs[0]?.errors.map((e) => e.path),
      ["$input.id"],
    );
  } finally {
    TypedRoute.setValidateErrorLogger(console.log);
  }
};
