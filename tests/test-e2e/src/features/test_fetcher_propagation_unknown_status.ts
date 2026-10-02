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
 * @evidence contracts/testing.md#behavioral-verification typia.assert accepts an undeclared HTTP failure in the IPropagation fallback union.
 * @evidence contracts/testing.md#independent-expectations The public propagation contract permits failures beyond a route explicit status map.
 * @evidence contracts/testing.md#distinguishing-cases A declared 200 success type and an undeclared 413 failure distinguish the fallback branch; this case does not assert malformed success rejection.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
