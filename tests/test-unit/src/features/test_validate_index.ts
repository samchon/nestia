import { TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";

/**
 * Verifies `TestValidator.index()` compares two lists of entities by
 * identifier.
 *
 * 1. Compare a list with itself, and descending string and numeric identifiers
 *    with themselves.
 * 2. Assert a changed identifier, a different order, and an empty side against a
 *    non-empty one fail, and a matching prefix passes.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `TestValidator.index()` on equal, changed, reordered, prefix, and empty lists and asserts acceptance or failure.
 * @evidence contracts/testing.md#independent-expectations Two lists agree when their identifiers agree in order, and a page is the first entities of the expected list; both follow from the documented use of `index`.
 * @evidence contracts/testing.md#distinguishing-cases Equal, changed identifier, reordered, prefix, both empty, empty gotten, and empty expected are separate cases, with descending string and numeric identifiers as boundaries of the order rule.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
