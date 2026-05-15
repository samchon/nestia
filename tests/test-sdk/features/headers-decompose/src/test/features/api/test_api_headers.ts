import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips correctly when nestia.config sets
 * `swagger.decompose: true`.
 *
 * The `decompose` option is consumed by the swagger composer (each
 * header becomes its own OpenAPI parameter) and does not change the SDK
 * fetcher's runtime path. This test exercises the same observable
 * round-trip and rejection contract as the base `headers` fixture; the
 * pair pins that the swagger-side option doesn't accidentally bleed
 * into runtime header handling.
 *
 *  1. Send a request with header keys and well-typed values.
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
