import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

/**
 * Verifies propagation accepts undeclared failure status codes.
 *
 * Locks the fallback branch of `IPropagation`. Generated SDK e2e tests assert
 * propagated outputs with typia, and HTTP servers can still return statuses
 * that are not listed in the route's explicit exception map, such as payload
 * size errors from the platform.
 *
 * 1. Build an `IPropagation` value with a declared 200 success branch.
 * 2. Fill it with an undeclared 413 failure response.
 * 3. Assert typia accepts the fallback failure branch.
 *
 * @evidence contracts/testing.md#behavioral-verification It asks typia to assert an `IPropagation` value carrying an undeclared 413 failure, so a type whose failure branch admits only declared statuses is detected as rejecting valid output.
 * @evidence contracts/testing.md#independent-expectations That the platform can answer statuses the route does not declare is an HTTP fact, and the value under test is a literal 413 response.
 * @evidence contracts/testing.md#distinguishing-cases The declared 200 branch is in the type and the undeclared 413 is the adjacent input that must also be accepted; rejection of malformed values is owned by typia itself.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process discovered by `DynamicExecutor`, and drives the `@nestia/fetcher` operation in-process with a stubbed `connection.fetch`, so no server or socket is involved.
 */
export async function test_fetcher_propagation_unknown_status(): Promise<void> {
  typia.assert<IPropagation<{ 200: string }, 200>>({
    success: false,
    status: 413,
    headers: {},
    data: {
      statusCode: 413,
      message: "Payload Too Large",
    },
  });
}
