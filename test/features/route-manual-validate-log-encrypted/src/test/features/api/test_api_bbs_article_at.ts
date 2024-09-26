import { TypedRoute } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";
import { v4 } from "uuid";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

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
  TestValidator.error("wrong data")(() => typia.assert(article));
  TestValidator.equals("logs")(logs)([
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
    },
  ]);
};
