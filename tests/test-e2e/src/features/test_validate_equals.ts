import { TestValidator } from "@nestia/e2e";
import typia from "typia";

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
 * @evidence contracts/testing.md#behavioral-verification TestValidator.equals accepts an unchanged JSON record and rejects a changed nested title.
 * @evidence contracts/testing.md#independent-expectations The copied record is independently identical until one nested title is deliberately changed.
 * @evidence contracts/testing.md#distinguishing-cases An equal nested page passes and one changed article title fails; date and null distinctions have separate cases.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
