import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips mixed-case HTTP header names and
 * rejects type-incorrect array payloads.
 *
 * Header names are deliberately mixed-case (`x-fLags`, `X-Descriptions`)
 * to assert RFC-compliant case-insensitive normalization through the SDK
 * fetch path. The string-instead-of-number-array case pins that typia
 * runtime validation fires for parsed header arrays even though HTTP
 * itself would accept them as valid strings. Sibling fixtures
 * `headers-decompose` and `headers-config-assert` mirror this test with
 * different nestia configs; the body must stay identical.
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
    "x-fLags": [true, false, true],
    "X-Descriptions": ["a", "b", "c"],
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
