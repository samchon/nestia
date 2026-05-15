import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips mixed-case names with the `decompose`
 * SDK config that emits per-header fetch parameters.
 *
 * Mirror of the base `headers` fixture. With `decompose: true` each
 * header is passed as a positional parameter rather than a single object
 * — the mixed-case keys and the type-incorrect array rejection must
 * behave identically across both decompose modes.
 *
 *  1. Send a request with mixed-case header keys and well-typed values.
 *  2. Assert the echoed payload preserves header semantics.
 *  3. Send a request whose `x-values` is `["a","b","c"]` and expect rejection.
 */
export const test_api_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  const headers: Required<IHeaders> = {
    ...typia.random<Required<IHeaders>>(),
    "x-values": [1, 2, 3],
    "x-flags": [true, false, true],
    "X-descriptions": ["a", "b", "c"],
  };
  const output: IHeaders = await api.functional.headers.emplace(
    {
      ...connection,
      headers,
    },
    "something",
  );
  typia.assertEquals(output);
  TestValidator.equals("headers", headers, output as Required<IHeaders>);

  await TestValidator.error("headers", () =>
    api.functional.headers.emplace(
      {
        ...connection,
        headers: {
          ...headers,
          "x-values": ["one", "two", "three"] as any as number[],
        },
      },
      "something",
    ),
  );
};
