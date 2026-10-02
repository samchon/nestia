import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies a valid article body reaches the server and returns an exact article
 * shape.
 *
 * The authored IBbsArticle and IStore DTOs establish the request and response
 * domains independently of SDK output.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 */
export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  const article: IBbsArticle = await api.functional.body.store(
    connection,
    typia.random<IBbsArticle.IStore>(),
  );
  typia.assertEquals(article);
};
