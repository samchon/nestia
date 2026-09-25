import { TestValidator } from "@nestia/e2e";

import { generate_random_articles } from "./internal/generate_random_articles";

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
