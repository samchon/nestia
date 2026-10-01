import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips mixed-case HTTP header names and rejects
 * type-incorrect array payloads.
 *
 * Header names are deliberately mixed-case (`x-fLags`, `X-Descriptions`) to
 * assert RFC-compliant case-insensitive normalization through the SDK fetch
 * path. The string-instead-of-number-array case pins that typia runtime
 * validation fires for parsed header arrays even though HTTP itself would
 * accept them as valid strings. The `headers-config-assert` sibling holds a
 * byte-identical copy under a different nestia config; `headers-decompose`
 * lower-cases the header keys but keeps the same rejection assertion.
 *
 * 1. Send a request with mixed-case header keys and well-typed values.
 * 2. Assert the echoed payload preserves header semantics.
 * 3. Send a request whose `x-values` is `["one","two","three"]` and expect
 *    rejection (numeric array expected, not strings).
 *
 * @evidence contracts/testing.md#behavioral-verification The generated header request must echo its full submitted Required<IHeaders>, including mixed-case x-fLags/X-Descriptions, and string values replacing the numeric array must reject.
 * @evidence contracts/testing.md#independent-expectations Authored IHeaders and the echo handler establish value preservation; HTTP header names are case-insensitive. Literal array contents plus complete input equality supplement installed typia shape validation without asserting a random field literal.
 * @evidence contracts/testing.md#distinguishing-cases Mixed-case names, numeric/boolean/string arrays and invalid numeric-array values distinguish encoding/normalization/validation. The negative accepts any rejection; this case does not independently specify400.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual SDK header encoding and backend TypedHeaders normalization must interoperate across HTTP; a string join or schema unit cannot establish the full roundtrip.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
