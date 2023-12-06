import { TestValidator } from "@nestia/e2e";

import api from "@api";

export const test_api_bbs_article_erase = (): void => {
  const erase = (api.functional.bbs.articles as any).erase;
  TestValidator.equals("ignore")(erase)(undefined);
};
