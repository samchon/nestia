import typia from "typia";

import api from "../../../../api";
import { IBbsArticle } from "../../../../features/route-manual-validate/api/structures/IBbsArticle";

export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.route_manual_validate.route.random(connection);
  typia.assertEquals(article);
};
