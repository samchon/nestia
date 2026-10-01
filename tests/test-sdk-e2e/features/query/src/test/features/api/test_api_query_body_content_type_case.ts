import { TestValidator } from "@nestia/e2e";

import api from "@api";

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
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual raw HTTP media recognition and native form decoder must connect independently of the generated client header normalization; direct parser units cannot certify this received header.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
