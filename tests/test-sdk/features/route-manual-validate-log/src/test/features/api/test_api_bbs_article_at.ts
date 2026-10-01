import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";
import { v4 } from "uuid";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

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
 * @evidence contracts/testing.md#behavioral-verification Generated article request must return the deliberately invalid article while logging exactly one complete GET/path/data/error record with created_at date-time expectation and wrong-data value.
 * @evidence contracts/testing.md#independent-expectations The authored handler supplies literal title/body/null/invalid date and echoes submitted UUID; the documented validation-log contract supplies method/path/error structure. Handwritten expected record and independent typia rejection establish the malformed payload.
 * @evidence contracts/testing.md#distinguishing-cases Invalid response passes through validate.log instead of causing HTTP rejection, contrasting ordinary validate modes. Exact single full record rejects duplicate/omitted/wrong-field logging.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated request, native response validation and public TypedRoute logger must connect through HTTP; a local validator result cannot certify log path/method and sent payload.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This serial case installs its local logger explicitly and restores the documented default console.log in finally, including assertion/request failure. Local logs cannot satisfy another case; the feature entry owns server closure and copied outputs stay isolated.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_api_bbs_article_at = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));
  try {
    const id: string = v4();
    const article: IBbsArticle = await api.functional.bbs.articles.at(
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
        path: `/bbs/articles/${id}`,
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
