import { TestValidator } from "@nestia/e2e";
import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

/**
 * Verifies propagation accepts an undeclared failure status and still refuses
 * the values the branches do not describe.
 *
 * Locks the fallback branch of `IPropagation`. Generated SDK e2e tests assert
 * propagated outputs with typia, and HTTP servers can still return statuses
 * that are not listed in the route's explicit exception map, such as payload
 * size errors from the platform. The fallback admits only a failure, so the
 * adjacent values it must not admit are an undeclared status marked as a
 * success and a declared success branch carrying data of another type.
 *
 * 1. Build an `IPropagation` value with a declared 200 success branch.
 * 2. Assert typia accepts an undeclared 413 failure and the declared 200 success.
 * 3. Assert typia rejects a 413 marked as a success and a 200 success carrying
 *    data of the wrong type.
 *
 * @evidence contracts/testing.md#behavioral-verification It asks typia to assert `IPropagation` values, so a type whose failure branch admits only declared statuses is detected as rejecting valid output, and a type whose fallback admits a success or whose declared branch ignores its data type is detected as accepting an invalid one.
 * @evidence contracts/testing.md#independent-expectations That the platform can answer statuses the route does not declare, and that only a declared success status denotes success, are HTTP and SDK facts written as literal values; typia's own assertion is the reference for membership in the type.
 * @evidence contracts/testing.md#distinguishing-cases The declared 200 success and the undeclared 413 failure are the positive inputs; the 413 success and the 200 success with a numeric body are the adjacent negative inputs; a declared status marked as a failure is deliberately admitted by the fallback and is not asserted; rejection of other malformed values is owned by typia itself.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-sdk` process discovered by `DynamicExecutor`, evaluating the `@nestia/fetcher` type through typia's compiled assertion in-process; no fetch operation, server or socket is involved.
 */
export async function test_fetcher_propagation_unknown_status(): Promise<void> {
  type Output = IPropagation<{ 200: string }, 200>;
  typia.assert<Output>({
    success: false,
    status: 413,
    headers: {},
    data: {
      statusCode: 413,
      message: "Payload Too Large",
    },
  });
  typia.assert<Output>({
    success: true,
    status: 200,
    headers: {},
    data: "ok",
  });

  TestValidator.error("undeclared status as success", () =>
    typia.assert<Output>({
      success: true,
      status: 413,
      headers: {},
      data: "ok",
    }),
  );
  TestValidator.error("declared success with a wrong body", () =>
    typia.assert<Output>({
      success: true,
      status: 200,
      headers: {},
      data: 200,
    }),
  );
}
