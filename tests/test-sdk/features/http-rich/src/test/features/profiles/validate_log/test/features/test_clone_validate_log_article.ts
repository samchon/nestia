import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";
import { v4 } from "uuid";

import { ValidateLogArticle } from "../../../../../../validate-log/structures/ValidateLogArticle";
import api from "../../api";

/**
 * Verifies `TypedRoute.setValidateErrorLogger` receives a structured
 * `IValidateErrorLog` entry when the controller returns a malformed value.
 *
 * `IValidateErrorLog` is a public contract consumed downstream; the `expected:
 * 'string & Format<"date-time">'` field embeds the Typia tag literal verbatim,
 * so a Go-side change to tag rendering would silently break consumers'
 * parsers.
 *
 * 1. Register a logger and call a route that returns an invalid `at` field.
 * 2. Expect exactly one log entry naming method + path + the malformed data.
 * 3. Assert the `errors[]` entry carries `expected: 'string &
 *    Format<"date-time">'`.
 *
 * @evidence contracts/testing.md#behavioral-verification The original malformed date-time response must still arrive, fail independent typia assertion and produce exactly one complete log containing its original error path, tag text, method, route and response data.
 * @evidence contracts/testing.md#independent-expectations Original authored malformed controller values and literal public error-log fields define the exact response and log expectations; typia independently rejects the malformed JSON response.
 * @evidence contracts/testing.md#distinguishing-cases Malformed JSON date-time and querified UUID outputs distinguish log-and-send from default assert rejection; exact log count and fields reject missing, duplicate or incorrect log entries.
 * @evidence contracts/testing.md#execution-ownership The shared compiled consumer discovers this matching file and export; requests reach the separately compiled validate.log producer on the same actual listener.
 * @evidence contracts/e2e.md#necessary-boundary Installed native validate.log serialization, actual SDK transport, independent response validation and the actual shared TypedRoute logger must connect; a compile-only serializer test cannot prove logging and sending coexist.
 * @evidence contracts/e2e.md#shared-execution Both response formats share one validate.log producer program, generation graph, installed dependency graph, compiled consumer and actual listener. Duplicate legacy inputs with no additional authored assertions share these same operations.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity A private route isolates stateless data. This sequential case installs its own actual logger and restores console.log in finally, retaining the original reset contract without leaking its log array into another case.
 * @evidence contracts/e2e.md#preserved-coverage Every original call, literal response and complete log comparison remains apart from recorded names, imports and private routes. Equivalent duplicate roots own identical controllers/options and no additional authored cases.
 */
export const test_clone_validate_log_article = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));
  try {
    const id: string = v4();
    const article: ValidateLogArticle =
      await api.functional.http_rich.options.validate_log.bbs.articles.at(
        connection,
        id,
      );
    TestValidator.error("wrong data", () => typia.assert(article));
    TestValidator.equals("logs", logs, [
      {
        errors: [
          {
            path: "$input.created_at",
            expected: `string & Format<"date-time">`,
            value: "wrong-data",
          },
        ],
        method: "GET",
        path: `/http_rich/options/validate_log/bbs/articles/${id}`,
        data: {
          id,
          title: "Hello, world!",
          body: "This is a test article.",
          thumbnail: null,
          created_at: "wrong-data",
        },
      },
    ]);
  } finally {
    TypedRoute.setValidateErrorLogger(console.log);
  }
};
