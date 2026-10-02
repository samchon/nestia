import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies a null article title is rejected through the generated client.
 *
 * IStore requires a string title and Nest request validation reports malformed
 * typed JSON as HTTP 400; no expected value comes from the emitted
 * implementation.
 *
 * 1. Call the generated client against the feature backend.
 * 2. Require the request outcome described by the authored controller and DTO.
 */
export const test_api_body_invalid = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.body.store(connection, {
      ...typia.random<IBbsArticle.IStore>(),
      title: null!,
    }),
  );
};
