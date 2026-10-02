import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IBbsArticle } from "@api/lib/structures/IBbsArticle";

/**
 * Verifies calls duplicated and multiple routes, validates both article shapes
 * and compares their responses.
 *
 * Both authored route names expose the same controller value and IBbsArticle
 * contract.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_duplicated = async (
  connection: api.IConnection,
): Promise<void> => {
  const [x, y]: [IBbsArticle, IBbsArticle] = [
    await api.functional.duplicated.at(connection),
    await api.functional.multiple.at(connection),
  ];
  typia.assertEquals([x, y]);

  TestValidator.equals("duplicated", x, y);
};
