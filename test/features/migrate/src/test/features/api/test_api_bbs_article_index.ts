import { MigrateFetcher } from "@nestia/fetcher/lib/MigrateFetcher";
import { IMigrateRoute } from "@samchon/openapi";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IPage } from "@api/lib/structures/IPage";

import { ITestProps } from "../../ITestProps";

export const test_api_bbs_article_index = async (
  props: ITestProps,
): Promise<void> => {
  const page: IPage<IBbsArticle.ISummary> = await MigrateFetcher.request({
    route: props.route("patch", "/bbs/articles"),
    connection: props.connection,
    arguments: [typia.random<IPage.IRequest>()],
  });
  typia.assert(page);
};
