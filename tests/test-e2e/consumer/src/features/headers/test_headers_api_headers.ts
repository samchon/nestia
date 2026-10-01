import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../api";
import { IHeadersHeaders } from "../../oracle/headers/structures/IHeadersHeaders";

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
 * @evidence contracts/testing.md#behavioral-verification The generated header request must echo its full submitted Required<IHeadersHeaders>, including mixed-case x-fLags/X-Descriptions, and string values replacing the numeric array must reject.
 * @evidence contracts/testing.md#independent-expectations Authored IHeadersHeaders and the echo handler establish value preservation; HTTP header names are case-insensitive. Literal array contents plus complete input equality supplement installed typia shape validation without asserting a random field literal.
 * @evidence contracts/testing.md#distinguishing-cases Mixed-case names, numeric/boolean/string arrays and invalid numeric-array values distinguish encoding/normalization/validation. The negative accepts any rejection; this case does not independently specify400.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual SDK header encoding and backend TypedHeaders normalization must interoperate across HTTP; a string join or schema unit cannot establish the full roundtrip.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_headers_api_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  const headers: Required<IHeadersHeaders> = {
    ...typia.random<Required<IHeadersHeaders>>(),
    "x-values": [1, 2, 3],
    "x-fLags": [true, false, true],
    "X-Descriptions": ["a", "b", "c"],
  };
  const output: IHeadersHeaders = await api.functional.headers.headers.emplace(
    {
      ...connection,
      headers,
    },
    "something",
  );
  typia.assertEquals(output);
  TestValidator.equals("headers", headers, output as Required<IHeadersHeaders>);

  await TestValidator.error("headers", () =>
    api.functional.headers.headers.emplace(
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
