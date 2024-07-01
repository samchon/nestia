import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

import { ITestProps } from "../../ITestProps";

export const test_api_bbs_article_create = async (
  props: ITestProps,
): Promise<void> => {
  const article: IBbsArticle = await MigrateFetcher.request({
    route: props.route("post", "/bbs/articles"),
    connection: props.connection,
    arguments: [typia.random<IBbsArticle.ICreate>()],
  });
  typia.assert(article);
};
