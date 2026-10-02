import { TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";

/**
 * Verifies testValidator.index validates matching identifier order and
 * meaningful prefixes.
 *
 * The authored identifier lists define literal order and prefix expectations
 * independently.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert descending strings and numbers pass, changed identifiers and reversed
 *    order fail, prefixes and two empty arrays pass, and unilateral empty
 *    arrays fail.
 *
 * @evidence contracts/testing.md#behavioral-verification TestValidator.index validates matching identifier order and meaningful prefixes.
 * @evidence contracts/testing.md#independent-expectations The authored identifier lists define literal order and prefix expectations independently.
 * @evidence contracts/testing.md#distinguishing-cases Descending strings and numbers pass, changed identifiers and reversed order fail, prefixes and two empty arrays pass, and unilateral empty arrays fail.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
 */
export async function test_validate_index(): Promise<void> {
  const { data } = generate_random_articles();

  TestValidator.index("index", data, data);
  TestValidator.index(
    "descending identifiers",
    [{ id: "b" }, { id: "a" }],
    [{ id: "b" }, { id: "a" }],
  );
  TestValidator.index(
    "numeric identifiers",
    [{ id: 2 }, { id: 1 }],
    [{ id: 2 }, { id: 1 }],
  );
  TestValidator.error("error", () =>
    TestValidator.index(
      "index",
      data,
      [
        {
          ...data[0]!,
          id: data[0]!.id + "sdafasdf",
        },
        ...data.slice(1),
      ],
      false,
    ),
  );
  TestValidator.error("order", () =>
    TestValidator.index(
      "index",
      [{ id: "a" }, { id: "b" }],
      [{ id: "b" }, { id: "a" }],
    ),
  );

  // a page is the first entities: a matching prefix passes, but an empty
  // side against a non-empty one proves nothing and fails (#1712)
  TestValidator.index("prefix", [{ id: "a" }, { id: "b" }], [{ id: "a" }]);
  TestValidator.index<{ id: string }>("both empty", [], []);
  TestValidator.error("empty gotten", () =>
    TestValidator.index("empty gotten", [{ id: "a" }], []),
  );
  TestValidator.error("empty expected", () =>
    TestValidator.index<{ id: string }>("empty expected", [], [{ id: "a" }]),
  );
}
