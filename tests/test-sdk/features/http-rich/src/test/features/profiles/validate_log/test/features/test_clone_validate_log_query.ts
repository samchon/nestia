import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The original malformed UUID response must still answer200 with exact querified text and one log naming GET, its route and $input.id.
 * @evidence contracts/testing.md#independent-expectations The authored controller returns wrong-data for a UUID and count3. These inputs define the exact querified response; the public log contract defines the literal GET, route and $input.id error expectations independently of generated code.
 * @evidence contracts/testing.md#distinguishing-cases Malformed JSON date-time and querified UUID outputs distinguish log-and-send from default assert rejection; exact log count and fields reject missing, duplicate or incorrect log entries.
 * @evidence contracts/testing.md#execution-ownership The shared compiled consumer discovers this matching file and export; requests reach the separately compiled validate.log producer on the same actual listener.
 * @evidence contracts/e2e.md#necessary-boundary Installed native validate.log querification, actual HTTP content and the actual shared TypedRoute logger must agree; default assert serialization would answer500 instead of the authored200.
 * @evidence contracts/e2e.md#shared-execution Both response formats share one validate.log producer program, generation graph, installed dependency graph, compiled consumer and actual listener. Duplicate legacy inputs with no additional authored assertions share these same operations.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A private route isolates stateless data. This sequential case installs its own actual logger and restores console.log in finally, retaining the original reset contract without leaking its log array into another case.
 * @evidence contracts/e2e.md#preserved-coverage Every original call, literal response and complete log comparison remains apart from recorded names, imports and private routes. Equivalent duplicate roots own identical controllers/options and no additional authored cases.
 */
export const test_clone_validate_log_query = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));
  try {
    const response: Response = await fetch(
      `${connection.host}/http_rich/options/validate_log/query`,
    );
    TestValidator.equals("status", response.status, 200);
    TestValidator.equals(
      "body",
      await response.text(),
      "id=wrong-data&count=3",
    );
    TestValidator.equals("logs", logs.length, 1);
    TestValidator.equals("method", logs[0]?.method, "GET");
    TestValidator.equals(
      "path",
      logs[0]?.path,
      "/http_rich/options/validate_log/query",
    );
    TestValidator.equals(
      "error path",
      logs[0]?.errors.map((e) => e.path),
      ["$input.id"],
    );
  } finally {
    TypedRoute.setValidateErrorLogger(console.log);
  }
};
