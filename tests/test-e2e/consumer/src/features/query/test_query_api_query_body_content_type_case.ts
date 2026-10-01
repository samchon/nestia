import { TestValidator } from "@nestia/e2e";

import api from "../../api";

/**
 * Verifies api query body content type case through its generated consumer.
 *
 * Mixed-case type/subtype plus charset contrasts canonical generated request
 * headers, including numeric/boolean coercion and a single array value. This
 * case does not submit an unsupported media type.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw mixed-case application/x-www-form-urlencoded with charset must return201 and echo all four submitted parameter strings.
 * @evidence contracts/testing.md#independent-expectations Explicit URLSearchParams input and authored echo handler establish values; media type matching is case-insensitive and charset must not defeat recognition.
 * @evidence contracts/testing.md#distinguishing-cases Mixed-case type/subtype plus charset contrasts canonical generated request headers, including numeric/boolean coercion and a single array value. This case does not submit an unsupported media type.
 * @evidence contracts/testing.md#execution-ownership The common generated consumer DynamicExecutor discovers this named export after the single consumer compilation. It receives the shared connection and aggregates failures without repeating preparation.
 * @evidence contracts/e2e.md#necessary-boundary Actual raw HTTP media recognition and native form decoder must connect independently of the generated client header normalization; direct parser units cannot certify this received header.
 * @evidence contracts/e2e.md#shared-execution This request shares one packed installation, one combined controller program, one generated client program and one Nest application with all rich-fixture cases. It creates no compiler project or feature backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario routes and DTO names have explicit namespaces in the combined fixture; requests retain their authored inputs and stateless handler expectations. Connectors retain their own finally cleanup. The common entry closes the application before removing its installation.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
 */
export const test_query_api_query_body_content_type_case = async (
  connection: api.IConnection,
): Promise<void> => {
  const input = new URLSearchParams({
    atomic: "atomic",
    limit: "10",
    enforce: "true",
    values: "value",
  });
  const response: Response = await fetch(
    `${connection.host}/query/query/body`,
    {
      method: "POST",
      headers: {
        "Content-Type": "Application/X-Www-Form-Urlencoded; Charset=UTF-8",
      },
      body: input,
    },
  );
  TestValidator.equals("status", response.status, 201);

  const output = new URLSearchParams(await response.text());
  TestValidator.equals("atomic", output.get("atomic"), input.get("atomic"));
  TestValidator.equals("limit", output.get("limit"), input.get("limit"));
  TestValidator.equals("enforce", output.get("enforce"), input.get("enforce"));
  TestValidator.equals("values", output.get("values"), input.get("values"));
};
