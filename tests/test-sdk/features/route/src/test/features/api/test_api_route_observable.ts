import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies Observable<T> controller returns generate SDK output as T.
 *
 * Locks the native return-type unwrap branch shared by Swagger metadata and
 * generated SDK aliases. NestJS treats Observable<T> as an asynchronous route
 * response just like Promise<T>; a regression would emit Promise<void> or an
 * Observable-shaped schema instead of the resolved article type.
 *
 * 1. Call a controller method that returns Observable<IBbsArticle>.
 * 2. Assign the generated SDK result to IBbsArticle.
 * 3. Assert the runtime payload satisfies the article structure.
 */
export const test_api_route_observable = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle =
    await api.functional.route.observable(connection);

  typia.assertEquals(article);
};
