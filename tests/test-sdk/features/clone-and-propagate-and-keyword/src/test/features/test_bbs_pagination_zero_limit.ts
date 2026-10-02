import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { BbsArticlesController } from "../../controllers/BbsArticlesController";

/** A zero-sized page is valid input and must retain finite pagination. */
export const test_bbs_pagination_zero_limit = async (): Promise<void> => {
  const controller = new BbsArticlesController();
  const empty = typia.assert(
    await controller.index("general", { limit: 0, page: 0 }),
  );
  TestValidator.equals("zero-limit pagination", empty.pagination, {
    current: 0,
    limit: 0,
    records: 5,
    pages: 0,
  });
  TestValidator.equals("zero-limit data", empty.data, []);
  const single = typia.assert(
    await controller.index("general", { limit: 1, page: 1 }),
  );
  TestValidator.equals("nonzero-limit pagination", single.pagination, {
    current: 1,
    limit: 1,
    records: 9,
    pages: 9,
  });
  TestValidator.equals("nonzero-limit data", single.data.length, 1);
};
