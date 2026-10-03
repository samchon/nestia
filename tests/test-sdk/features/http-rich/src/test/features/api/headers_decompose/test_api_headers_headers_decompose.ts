import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { IHeaders } from "../../../../structures/headers_decompose/IHeaders";

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
 * @evidence contracts/testing.md#behavioral-verification The actual TypedRoute.Patch client preserves mixed-case headers and numeric/boolean/string arrays, with exact equality, and rejects the otherwise identical string numeric-array values.
 * @evidence contracts/testing.md#independent-expectations Preserved authored DTOs, literal header arrays and the void controller establish expectations independently of generation. Header parameter order follows the authored declaration and the ignore annotation excludes X-descriptions.
 * @evidence contracts/testing.md#distinguishing-cases The header HTTP case retains valid and invalid numeric-array twins; the document case retains ordered names and omission of the ignored header. Health and dynamic performance retain their original successful transport/shape assertions without claiming malformed endpoint coverage.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after public compilation; this case reads fresh product output or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, application-based generator and generated consumer must agree on authored controller metadata and transport. Direct composer units cannot prove that metadata connection.
 * @evidence contracts/e2e.md#shared-execution One installation, producer, all-generation, consumer and application serve this case and the other rich inputs, without any per-option compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Prefixed stateless routes isolate scenario identities; document reads and request inputs are case-local, generation creates fresh artifacts and the runner closes its application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertions from tests/test-sdk/features/headers-decompose/src/test/features/api/test_api_headers.ts remain with only recorded import, class, route, case and artifact-location identities changed. The shared configuration explicitly retains decompose true and the class/function callback; beautify formatting has direct generator unit coverage.
 */
export const test_api_headers_headers_decompose = async (
  connection: api.IConnection,
): Promise<void> => {
  const headers: Required<IHeaders> = {
    ...typia.random<Required<IHeaders>>(),
    "x-values": [1, 2, 3],
    "x-flags": [true, false, true],
    "X-descriptions": ["a", "b", "c"],
  };
  const output: IHeaders =
    await api.functional.http_rich.headers_decompose.headers.emplace(
      {
        ...connection,
        headers,
      },
      "something",
    );
  typia.assertEquals(output);
  TestValidator.equals("headers", headers, output as Required<IHeaders>);

  await TestValidator.error("headers", () =>
    api.functional.http_rich.headers_decompose.headers.emplace(
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
