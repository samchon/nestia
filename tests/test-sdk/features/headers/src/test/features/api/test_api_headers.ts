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
 * @evidence contracts/testing.md#behavioral-verification Round-trips mixed-case numeric/boolean/string-array headers and requires rejection of a string-valued numeric array.
 * @evidence contracts/testing.md#independent-expectations The authored IHeaders types and HTTP case-insensitive names establish valid parsed values.
 * @evidence contracts/testing.md#distinguishing-cases Valid mixed-case headers contrast with changing x-values alone to invalid string elements.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Round-trips mixed-case numeric/boolean/string-array headers and requires rejection of a string-valued numeric array. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Valid mixed-case headers contrast with changing x-values alone to invalid string elements. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
