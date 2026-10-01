import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies an error converts through the closure of its own class, never an
 * ancestor's, under the authored interleaved registration order.
 *
 * `ExceptionManager.insert()` sorted the registrations with a comparator that
 * answered "greater" for two unrelated classes in both directions. That is no
 * order, so a subclass registered after an unrelated class could stay behind
 * its superclass, and `route_error()`, which takes the first class an error is
 * an instance of, converted it with the superclass's closure (#1665).
 *
 * 1. Call routes throwing each registered class, registered with an unrelated
 *    class between `DomainError` and its subclasses, and assert each status.
 * 2. Keep the permutation-specificity rule in the shared unit population.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated routes throwing four error classes must produce400/409/404/410 under the authored interleaved registrations. All24 insertion-order controls execute in test_core_exception_manager_specificity.
 * @evidence contracts/testing.md#independent-expectations DomainErrors inheritance and authored registration closures supply the status mapping. Concrete subclass priority independently follows the exception-conversion contract; it is not read from current tuple order.
 * @evidence contracts/testing.md#distinguishing-cases Unrelated errors interleaved with a superclass and two subclasses distinguish invalid sorting from specificity. The SDK case exercises the authored initial registration over HTTP; all24 first-match constructor controls remain in the shared unit owner.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary The four real HTTP requests connect registered conversion closures to route errors. The portable permutation loop belongs to the shared unit owner and requires no independent server lifetime.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The authored backend registers these feature-local constructors before serving. This case reads their converted HTTP statuses without mutating registry order; distinct constructor identities prevent peer fixture matches, and the entry owns backend closure. The serial unit owner restores its exact registry state after permutations.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
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
