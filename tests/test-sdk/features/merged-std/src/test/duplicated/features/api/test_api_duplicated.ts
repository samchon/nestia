import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

import { IBbsArticle } from "../../../../features/duplicated/api/structures/IBbsArticle";

export const test_api_duplicated = async (
  connection: api.IConnection,
): Promise<void> => {
  const [x, y]: [IBbsArticle, IBbsArticle] = [
    await api.functional.duplicated.duplicated.at(connection),
    await api.functional.duplicated.multiple.at(connection),
  ];
  typia.assertEquals([x, y]);

  TestValidator.equals("duplicated", x, y);
};
