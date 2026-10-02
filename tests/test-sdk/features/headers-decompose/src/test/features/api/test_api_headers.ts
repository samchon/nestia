import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IHeaders } from "@api/lib/structures/IHeaders";

/**
 * Verifies @TypedHeaders round-trips correctly when nestia.config sets
 * `swagger.decompose: true`.
 *
 * The `decompose` option is consumed by the swagger composer (each header
 * becomes its own OpenAPI parameter) and does not change the SDK fetcher's
 * runtime path. This test exercises the same observable round-trip and
 * rejection contract as the base `headers` fixture; the pair pins that the
 * swagger-side option doesn't accidentally bleed into runtime header handling.
 *
 * 1. Send a request with header keys and well-typed values.
 * 2. Assert the echoed payload preserves header semantics.
 * 3. Send a request whose `x-values` is `["one","two","three"]` and expect
 *    rejection (numeric array expected, not strings).
 *
 * @evidence contracts/testing.md#behavioral-verification Round-trips typed headers with Swagger decomposition enabled and rejects invalid numeric-array values.
 * @evidence contracts/testing.md#independent-expectations Swagger decomposition changes document parameters, while the authored IHeaders request semantics remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Valid arrays and the adjacent string-element rejection ensure a documentation option cannot alter transport validation.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Round-trips typed headers with Swagger decomposition enabled and rejects invalid numeric-array values. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Valid arrays and the adjacent string-element rejection ensure a documentation option cannot alter transport validation. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
