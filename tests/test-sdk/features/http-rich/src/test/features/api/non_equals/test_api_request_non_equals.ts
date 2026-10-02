import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";

import { IRequestDto } from "../../../../structures/non_equals/IRequestDto";

/**
 * Verifies structural request acceptance and declared response serialization.
 *
 * The request keeps declared string properties; an additional request property
 * must be accepted, then omitted from the serialized response.
 *
 * 1. Execute the authored fixture's generated client or read its generated
 *    document.
 * 2. Assert the independently defined behavior and shape.
 *
 * @evidence contracts/testing.md#behavioral-verification A valid structural request must echo its declared fields, an extra request field must be accepted but absent from the exact serialized response, and a wrong declared field must receive HTTP 400.
 * @evidence contracts/testing.md#independent-expectations The authored IRequestDto contains string a and b fields; literal input equality and exact authored DTO validation establish the output independently of emitted declarations.
 * @evidence contracts/testing.md#distinguishing-cases Valid input, one surplus property and one wrong declared property distinguish acceptance, serialization pruning and actual rejection; all original assertions remain.
 * @evidence contracts/testing.md#execution-ownership The matching file/export is discovered by the SDK shared HTTP entry. It consumes emitted client artifacts or actual HTTP responses; the case starts no compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native producer, generated client where used, authored controller and live adapter must agree on request and response semantics. Direct rule or generator units do not establish that runtime connection.
 * @evidence contracts/e2e.md#shared-execution All 18 scenarios share one input configuration, one generated SDK, one consumer program and one application. This case adds only its original assertions to that prepared population.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Distinct scenario routes select their own authored controllers; payloads and responses are case-local. The duplicated scenario intentionally reads one immutable module value. The runner closes the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage All assertions from non-equals/src/test/features/api/test_api_request.ts survive; only imports, discoverable case identity and the explicitly authored scenario route prefix change. Controller and DTO behavior remains unchanged.
 */
export const test_api_request_non_equals = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IRequestDto = { a: "a", b: "b" };
  const output: IRequestDto = await api.functional.http_rich.non_equals.request(
    connection,
    input,
  );
  TestValidator.equals("DTO", input, output);

  const surplusInput = { ...input, surplus: "accepted request property" };
  const surplus: IRequestDto =
    await api.functional.http_rich.non_equals.request(connection, surplusInput);
  TestValidator.equals(
    "surplus request property is not serialized",
    surplus,
    input,
  );
  typia.assertEquals(surplus);
  await TestValidator.httpError(
    "wrong declared property is rejected",
    400,
    () =>
      api.functional.http_rich.non_equals.request(connection, {
        a: 42,
        b: "b",
      } as unknown as IRequestDto),
  );
};
