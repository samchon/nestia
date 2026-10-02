import { TestValidator } from "../../../../packages/e2e/lib";
import { generate_random_articles } from "./internal/generate_random_articles";
import { IBbsArticle } from "./structures/IBbsArticle";
import { IPage } from "./structures/IPage";

/**
 * Verifies testValidator.equals accepts an unchanged JSON record and rejects a
 * changed nested title.
 *
 * The copied record is independently identical until one nested title is
 * deliberately changed.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert an equal nested page passes and one changed article title fails; date
 *    and null distinctions have separate cases.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls TestValidator.equals on an independent deep copy and requires rejection after changing a nested title.
 * @evidence contracts/testing.md#independent-expectations JSON copying preserves the authored article values; changing one title creates a known difference without consulting the comparator.
 * @evidence contracts/testing.md#distinguishing-cases A nonempty ten-article fixture supplies the equal copy and one nested mismatch; Date and null comparisons have separate cases.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
 */
export function test_validate_equals(): void {
  const original: IPage<IBbsArticle.ISummary> = generate_random_articles(10);
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
