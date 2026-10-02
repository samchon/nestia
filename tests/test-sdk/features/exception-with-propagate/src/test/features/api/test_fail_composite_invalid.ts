import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.fail.composite;

/**
 * Verifies fail_composite propagates INVALID_PERMISSION with status 401.
 *
 * Propagation retains the authored error status and payload as a typed result
 * instead of converting the declared failure into an exception.
 *
 * 1. Call the generated permission endpoint with its authored scenario.
 * 2. Require status 401 and the exact INVALID_PERMISSION payload.
 */
export const test_fail_composite_invalid = async (connection: IConnection) => {
  const response = await test(connection, "INVALID_PERMISSION");
  if (response.status === 401)
    TestValidator.equals("response", response.data, "INVALID_PERMISSION");
  else throw Error("unexpected response");
};
