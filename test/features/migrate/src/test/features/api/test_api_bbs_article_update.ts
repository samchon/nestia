import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import typia from "typia";
import { v4 } from "uuid";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

import { ITestProps } from "../../ITestProps";

export const test_api_bbs_article_update = async (
  props: ITestProps,
): Promise<void> => {
  await MigrateFetcher.request({
    route: props.route("put", "/bbs/articles/{id}"),
    connection: props.connection,
    arguments: [v4(), typia.random<IBbsArticle.IUpdate>()],
  });
};
