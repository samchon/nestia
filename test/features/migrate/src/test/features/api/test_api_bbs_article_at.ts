import { IPropagation } from "@nestia/fetcher";
import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

import { ITestProps } from "../../ITestProps";

export const test_api_bbs_article_at = async (
  props: ITestProps,
): Promise<void> => {
  const article: IBbsArticle = await MigrateFetcher.request({
    route: props.route("get", "/bbs/articles/{id}"),
    connection: props.connection,
    arguments: [v4()],
  });
  typia.assert(article);

  const propa: IPropagation.IBranch<boolean, number, any> =
    await MigrateFetcher.propagate({
      route: props.route("get", "/bbs/articles/{id}"),
      connection: props.connection,
      arguments: [v4()],
    });
  typia.assert(propa);
};
