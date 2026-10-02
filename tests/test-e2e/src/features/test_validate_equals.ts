import { TestValidator } from "@nestia/e2e";

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
