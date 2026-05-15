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
 * `IValidateErrorLog` is a public contract consumed downstream; the
 * `expected: 'string & Format<"date-time">'` field embeds the Typia tag
 * literal verbatim, so a Go-side change to tag rendering would silently
 * break consumers' parsers. Sibling fixtures (`-fastify`, `-encrypted`)
 * mirror this test to pin runtime-adapter parity — the assertion shape
 * must stay identical across all three.
 *
 *  1. Register a logger and call a route that returns an invalid `at` field.
 *  2. Expect exactly one log entry naming method + path + the malformed data.
 *  3. Assert the `errors[]` entry carries `expected: 'string & Format<"date-time">'`.
 */
export const test_api_bbs_article_at = async (
  connection: api.IConnection,
): Promise<void> => {
  const logs: TypedRoute.IValidateErrorLog[] = [];
  TypedRoute.setValidateErrorLogger((l) => logs.push(l));

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
};
