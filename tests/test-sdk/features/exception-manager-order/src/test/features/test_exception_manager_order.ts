import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies typed routes select each registered error converter's HTTP status.
 *
 * An unrelated registration separates the ancestor from its subclasses. The
 * permutation assertions now execute in the core unit owner; these requests
 * retain the actual route-to-converter-to-generated SDK connection.
 *
 * 1. Call the four original routes throwing their registered error classes.
 * 2. Require HTTP 400, 409, 404 and 410 for their respective converters.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated SDK calls reach the four typed routes and must reject with each converter's original 400/409/404/410 status, rather than a superclass or server fallback.
 * @evidence contracts/testing.md#independent-expectations The authored registration assigns domain400, unrelated409, not-found404 and gone410. Those literal statuses independently define the transport results.
 * @evidence contracts/testing.md#distinguishing-cases Ancestor, unrelated, subclass and nested-subclass errors distinguish converter selection. The core unit separately owns every registration permutation and first-match assertion.
 * @evidence contracts/testing.md#execution-ownership The SDK fixture entry discovers this matching case after actual generation and runtime preparation. Direct core units own ordering without a compiler or host.
 * @evidence contracts/e2e.md#necessary-boundary Actual typed-route error conversion and generated SDK rejection must agree on the registered status; direct insertion ordering cannot certify that HTTP connection.
 * @evidence contracts/e2e.md#shared-execution Four requests share the existing generation, runtime and listener. Ordering needs no integration preparation and joins the canonical core units.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Backend registers its own four classes before listening and owns teardown. This case reads their request results without rewriting registrations during transport execution.
 * @evidence contracts/e2e.md#preserved-coverage All four original HTTP expressions and statuses are unchanged. All 24 permutations, erase/insert sequence and first-match class assertions execute in the core unit owner; no public declaration cast exposes internal tuples.
 */
export const test_exception_manager_order = async (
  connection: api.IConnection,
): Promise<void> => {
  const errors = api.functional.errors;
  await TestValidator.httpError("domain", 400, () => errors.domain(connection));
  await TestValidator.httpError("other", 409, () => errors.other(connection));
  await TestValidator.httpError("not found", 404, () =>
    errors.notFound(connection),
  );
  await TestValidator.httpError("gone", 410, () => errors.gone(connection));
};
