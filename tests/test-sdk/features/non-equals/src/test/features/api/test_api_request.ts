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
