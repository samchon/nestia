import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies requires the generated articles namespace to omit erase.
 *
 * The authored erase operation is explicitly ignored for SDK generation.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_api_bbs_article_erase = (): void => {
  const erase = (api.functional.bbs.articles as any).erase;
  TestValidator.equals("ignore", erase, undefined);
};
