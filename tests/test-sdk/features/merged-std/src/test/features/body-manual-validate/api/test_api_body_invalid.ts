import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "../../../../features/body-manual-validate/api/structures/IBbsArticle";

export const test_api_body = async (
  connection: api.IConnection,
): Promise<void> => {
  await TestValidator.httpError("invalid", 400, () =>
    api.functional.body_manual_validate.body.store(connection, {
      ...typia.random<IBbsArticle.IStore>(),
      title: null!,
    }),
  );
};
