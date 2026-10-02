import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies URL-encoded bodies accept mixed-case media types with a charset
 * parameter.
 *
 * The raw HTTP header reaches decorator media-type normalization without
 * generated metadata hiding its case.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and
 *    preserve every authored field in the response query text.
 *
 * @evidence contracts/testing.md#behavioral-verification Application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and preserve every authored field in the response query text.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: Application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and preserve every authored field in the response query text.
 * @evidence contracts/testing.md#distinguishing-cases Application/X-Www-Form-Urlencoded; Charset=UTF-8 must return 201 and preserve every authored field in the response query text.
 * @evidence contracts/testing.md#execution-ownership The query installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The raw HTTP header reaches decorator media-type normalization without generated metadata hiding its case.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_query_body_content_type_case = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = new URLSearchParams({
    atomic: "atomic",
    limit: "10",
    enforce: "true",
    values: "value",
  });
  const response: Response = await fetch(`${connection.host}/query/body`, {
    method: "POST",
    headers: {
      "Content-Type": "Application/X-Www-Form-Urlencoded; Charset=UTF-8",
    },
    body: input,
  });
  TestValidator.equals("status", response.status, 201);

  const output = new URLSearchParams(await response.text());
  TestValidator.equals("atomic", output.get("atomic"), input.get("atomic"));
  TestValidator.equals("limit", output.get("limit"), input.get("limit"));
  TestValidator.equals("enforce", output.get("enforce"), input.get("enforce"));
  TestValidator.equals("values", output.get("values"), input.get("values"));
};
