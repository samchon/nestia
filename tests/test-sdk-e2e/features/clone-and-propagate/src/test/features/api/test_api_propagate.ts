import { TestValidator } from "@nestia/e2e";
import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "@api";
import { IUser } from "@api/lib/structures/IUser";

/**
 * Verifies api propagate through its generated consumer.
 *
 * Authored controller annotations supply the observable schema or status
 * contract.
 *
 * 1. Run the generated request or read its emitted document.
 * 2. Compare the retained output with the independent authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated cloned propagation request must return a valid IUser status map with exact accepted status202 and success true; an allowed unknown/failure union branch no longer substitutes for the authored handler success.
 * @evidence contracts/testing.md#independent-expectations The authored UsersController.getUserProfile uses HttpCode ACCEPTED and returns an IUser; that independent status and shape contract establishes expectations. Its random IUser is not an echo of the submitted admin query.
 * @evidence contracts/testing.md#distinguishing-cases This pins nondefault success202 with cloned namespaced/recursive DTO metadata. Permission propagation cases own actual rejection branches; this handler never executes its declared404 error.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after generation; compile-time controls are enforced by the shared consumer compilation before this runtime entry. Runtime assertion errors fail the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects native clone/status metadata, generated propagation client, actual Nest HttpCode handling and fetcher response discrimination. A declaration-only type check cannot establish the real accepted status.
 * @evidence contracts/e2e.md#shared-execution Feature generation and installed package preparation are reused across these controls and compatible cohorts; independent preparation in this case is limited to the explicitly described adapter lifetimes. Native dispatch and Node processes are shared while configurations keep independent compiler programs and metadata scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The request reuses feature generation/backend/runtime and launches nothing. Submitted values and the returned object belong to this call; the entry finally closes the isolated backend.
 * @evidence contracts/e2e.md#preserved-coverage Every original meaningful input, type/error control, document/reference or transport assertion remains. Literal UUID verdicts and accepted status/success strengthen formerly shared-oracle or union-shape-only checks where changed; related clone cases retain their distinct owners.
 */
export const test_api_propagate = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: IPropagation<
    {
      202: IUser;
      404: "404 Not Found";
    },
    202
  > = await api.functional.users.user.getUserProfile(connection, "something", {
    user_type: "admin",
  });
  typia.assert(output);
  TestValidator.equals("accepted status", output.status, 202);
  TestValidator.equals("accepted success", output.success, true);
};
