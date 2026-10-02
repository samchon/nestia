import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "../../../../api";
import { IHeaders } from "../../../../structures/headers/IHeaders";

/**
 * Verifies mixed-case headers and their array validation over HTTP.
 *
 * The numeric array and otherwise identical string-array request form a valid/rejected pair, with exact output equality covering normalization and decoding.
 *
 * 1. Execute the preserved requests or read newly generated artifacts.
 * 2. Check the original value, shape, rejection or generation assertions.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixed-case header names and numeric/boolean/string arrays must round-trip with exact authored IHeaders equality; string values in the numeric array must reject.
 * @evidence contracts/testing.md#independent-expectations The preserved authored IHeaders declaration and literal arrays establish type and value expectations independently of SDK output; HTTP header names are case insensitive.
 * @evidence contracts/testing.md#distinguishing-cases The numeric array and otherwise identical string-array request form a valid/rejected pair, with exact output equality covering normalization and decoding.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after its public compilation. Its case consumes actual generated artifacts or live responses and creates no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, actual generation and emitted consumer must agree on the authored operation. Direct name/schema or option units cannot establish this generated artifact or transport connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses the same installation, producer, all-generation, consumer compilation and application as the other rich scenarios. Its original assertions add no independent project preparation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed routes select stateless authored controllers. Request values and response/document reads are case-local; generation owns fresh source files, and the runner closes the actual application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All valid assertions from headers/src/test/features/api/test_api_headers.ts remain. Only imports, case/class/route identities, generated-artifact locations and the uniquely prefixed status DTO name change; controller algorithms and payload boundaries are preserved.
 */
export const test_api_headers_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  const headers: Required<IHeaders> = {
    ...typia.random<Required<IHeaders>>(),
    "x-values": [1, 2, 3],
    "x-fLags": [true, false, true],
    "X-Descriptions": ["a", "b", "c"],
  };
  const output: IHeaders = await api.functional.http_rich.headers.headers.emplace(
    {
      ...connection,
      headers,
    },
    "something",
  );
  typia.assertEquals(output);
  TestValidator.equals("headers", headers, output as Required<IHeaders>);

  await TestValidator.error("headers", () =>
    api.functional.http_rich.headers.headers.emplace(
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
