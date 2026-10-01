import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { IBbsArticle } from "./structures/IBbsArticle";
import { IPage } from "./structures/IPage";

/**
 * Verifies `TestValidator.equals()` accepts a deep copy and rejects a copy that
 * differs in one nested value.
 *
 * 1. Generate a random page of articles and copy it through JSON.
 * 2. Assert the copy is equal.
 * 3. Change one title in the copy and assert the comparison throws.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `TestValidator.equals()` on a random page and its JSON copy and asserts acceptance, then on a copy with one changed title and asserts the failure.
 * @evidence contracts/testing.md#independent-expectations A deep copy is equal to its original and a changed leaf is not; the page is random, so no expected value is derived from the validator.
 * @evidence contracts/testing.md#distinguishing-cases The identical copy is the positive case and the one-leaf change is the adjacent negative; dates, `null`, and extra keys are owned by their own tests.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-e2e` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
 */
export function test_validate_equals(): void {
  const original: IPage<IBbsArticle.ISummary> = (() => {
    while (true) {
      const page = typia.random<IPage<IBbsArticle.ISummary>>();
      if (page.data.length) return page;
    }
  })();
  const replica: IPage<IBbsArticle.ISummary> = JSON.parse(
    JSON.stringify(original),
  );

  // SAME
  TestValidator.equals("same", original, replica);

  // DIFFERENT
  replica.data[0]!.title += " -> to be different";
  TestValidator.error("different", () =>
    TestValidator.equals("", original, replica),
  );
}
