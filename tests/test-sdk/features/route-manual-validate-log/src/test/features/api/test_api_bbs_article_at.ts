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
 * @evidence contracts/testing.md#behavioral-verification Calls the malformed article route, rejects its date-time shape with typia and checks the complete logger entry including method, path, data and expected type.
 * @evidence contracts/testing.md#independent-expectations The fixture deliberately returns created_at wrong-data; the authored date-time field and literal controller payload establish expected diagnostics independently.
 * @evidence contracts/testing.md#distinguishing-cases An invalid response is returned and logged rather than blocked. The valid serializer and querified logger cases cover neighboring response modes.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under route-manual-validate-log/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The route-manual-validate-log fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data. The logger is restored to the documented console logger in finally so later cases cannot retain this log array.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. An invalid response is returned and logged rather than blocked. The valid serializer and querified logger cases cover neighboring response modes.
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
