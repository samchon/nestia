import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import api from "@api";
import { IRequestDto } from "@api/lib/structures/IRequestDto";

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
 * @evidence contracts/testing.md#behavioral-verification The generated request client calls the TypedBody/TypedRoute endpoint. Exact DTO equality and assertEquals distinguish leaked response extras; HTTP 400 distinguishes a wrong declared property.
 * @evidence contracts/testing.md#independent-expectations IRequestDto declares only a and b strings, structural body validation permits additional properties, and typed JSON serialization emits declared properties.
 * @evidence contracts/testing.md#distinguishing-cases Baseline valid input, one surplus property, and a numeric a distinguish acceptance from invalid declared shape.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The HTTP connection joins generated parameter serialization, server validation and response serialization; a direct metadata unit cannot observe the returned payload.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
 */
export const test_api_request = async (
  connection: api.IConnection,
): Promise<void> => {
  const input: IRequestDto = { a: "a", b: "b" };
  const output: IRequestDto = await api.functional.request(connection, input);
  TestValidator.equals("DTO", input, output);

  const surplusInput = { ...input, surplus: "accepted request property" };
  const surplus: IRequestDto = await api.functional.request(
    connection,
    surplusInput,
  );
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
      api.functional.request(connection, {
        a: 42,
        b: "b",
      } as unknown as IRequestDto),
  );
};
