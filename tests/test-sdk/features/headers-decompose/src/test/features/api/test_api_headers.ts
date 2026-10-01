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
 * @evidence contracts/testing.md#behavioral-verification Generated headers.emplace must echo the full submitted Required<IHeaders> object, including literal numeric/boolean/string arrays; replacing numeric x-values with three strings must reject.
 * @evidence contracts/testing.md#independent-expectations The authored header DTO requires numeric x-values and the handler echoes parsed headers. Full input equality and explicit1/2/3,true/false,true,a/b/c arrays independently establish selected values; typia also supplies the exact shape oracle.
 * @evidence contracts/testing.md#distinguishing-cases Valid mixed scalar/array headers and adjacent invalid string-for-number array contrast parsing/validation. Swagger decompose:true must not alter transport. The negative accepts any rejection and does not independently pin400.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Generated fetch header encoding, actual HTTP normalization and TypedHeaders parsing/validation must interoperate; composing OpenAPI parameters cannot prove the runtime echo.
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
