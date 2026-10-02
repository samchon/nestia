import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies requires the generated articles namespace to omit erase.
 *
 * The authored erase operation is explicitly ignored for SDK generation.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification Requires the generated articles namespace to omit erase.
 * @evidence contracts/testing.md#independent-expectations The authored erase operation is explicitly ignored for SDK generation.
 * @evidence contracts/testing.md#distinguishing-cases Ignored erase is absent while sibling store and update tests exercise retained routes.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Requires the generated articles namespace to omit erase. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Ignored erase is absent while sibling store and update tests exercise retained routes. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
export const test_api_bbs_article_erase = (): void => {
  const erase = (api.functional.bbs.articles as any).erase;
  TestValidator.equals("ignore", erase, undefined);
};
