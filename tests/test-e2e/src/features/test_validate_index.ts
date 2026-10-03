import { TestValidator } from "../../../../packages/e2e/lib";
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
 * @evidence contracts/testing.md#behavioral-verification Calls TestValidator.index on matching sequences and requires rejection for changed identifiers, reversed order and one-sided emptiness.
 * @evidence contracts/testing.md#independent-expectations Authored identifier arrays establish exact order and prefix expectations independently of the assertion helper.
 * @evidence contracts/testing.md#distinguishing-cases Full equality, matching prefixes, descending authored identifiers and two empty arrays pass; changed order, values and asymmetric emptiness fail.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
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
