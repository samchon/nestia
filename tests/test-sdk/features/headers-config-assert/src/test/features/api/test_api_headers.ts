import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips correctly when the @nestia/core
 * plugin is configured with `validate: "assert"`.
 *
 * For header parameters the Go transform at `core_transform.go:848-859`
 * collapses the 10-mode validate option down to three: `is`/`equals`
 * → is-programmer, `validate*` → validate-programmer, everything else
 * (assert family) → assert-programmer. So this fixture and the base
 * `headers` fixture both route through `HttpAssertHeadersProgrammer`.
 * The pair pins that the tsconfig validate option doesn't accidentally
 * change observable header behavior across modes in the assert family.
 *
 *  1. Send a request with mixed-case header keys and well-typed values.
 *  2. Assert the echoed payload preserves header semantics.
 *  3. Send a request whose `x-values` is `["one","two","three"]` and
 *     expect rejection (numeric array expected, not strings).
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
