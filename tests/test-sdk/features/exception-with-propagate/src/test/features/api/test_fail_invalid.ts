import { TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";

import api from "@api";

const test = api.functional.fail.get;

/**
 * Verifies fail propagates INVALID_PERMISSION with status 401.
 *
 * Propagation retains the authored error status and payload as a typed result
 * instead of converting the declared failure into an exception.
 *
 * 1. Call the generated permission endpoint with its authored scenario.
 * 2. Require status 401 and the exact INVALID_PERMISSION payload.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated permission client must return status 401 and INVALID_PERMISSION; another status throws and an altered payload fails TestValidator.equals.
 * @evidence contracts/testing.md#independent-expectations The authored controller defines permission status 401 and literal INVALID_PERMISSION, independently of generated response decoding.
 * @evidence contracts/testing.md#distinguishing-cases This file owns INVALID_PERMISSION on test_fail; sibling permission files own the other declared literals and alternate union/composite operations.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers this export after start.js compiles its generated consumer; the HTTP client/server connection is E2E.
 * @evidence contracts/e2e.md#necessary-boundary The generated propagation client must preserve a declared non-success HTTP status and literal body across fetch decoding.
 * @evidence contracts/e2e.md#shared-execution Permission cases reuse the same feature generation, compiled consumer and backend session; the restored suite still retains separate preparation for unrelated feature programs.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each call supplies its own literal scenario and retains no mutable state; backend lifetime is owned by the feature entry with its existing exceptional-start cleanup limitation.
 * @evidence contracts/e2e.md#preserved-coverage The original status branch and exact literal comparison survive in this individually discovered file; all original permission scenarios remain executable.
 */
export const test_fail_invalid = async (connection: IConnection) => {
  const response = await test(connection, "INVALID_PERMISSION");
  if (response.status === 401)
    TestValidator.equals("response", response.data, "INVALID_PERMISSION");
  else throw Error("unexpected response");
};
