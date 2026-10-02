import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Calls generated route.random over HTTP and checks exact IBbsArticle structure
 * after server serialization.
 */
export const test_api_route = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.route.random(connection);
  typia.assertEquals(article);
};
