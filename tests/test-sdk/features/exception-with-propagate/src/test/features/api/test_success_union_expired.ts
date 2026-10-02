import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.success.union;

/**
 * Verifies success_union propagates EXPIRED_PERMISSION with status 401.
 *
 * Propagation retains the authored error status and payload as a typed result
 * instead of converting the declared failure into an exception.
 *
 * 1. Call the generated permission endpoint with its authored scenario.
 * 2. Require status 401 and the exact EXPIRED_PERMISSION payload.
 */
export const test_success_union_expired = async (connection: IConnection) => {
  const response = await test(connection, "EXPIRED_PERMISSION");
  if (response.status === 401)
    TestValidator.equals("response", response.data, "EXPIRED_PERMISSION");
  else throw Error("unexpected response");
};
