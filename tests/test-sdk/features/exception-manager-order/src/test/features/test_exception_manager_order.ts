import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { HttpException } from "@nestjs/common";

import api from "@api";

import {
  DomainError,
  GoneError,
  NotFoundError,
  OtherError,
} from "../../DomainErrors";

/**
 * Verifies an error converts through the closure of its own class, never an
 * ancestor's, whatever order the classes were registered in.
 *
 * `ExceptionManager.insert()` sorted the registrations with a comparator that
 * answered "greater" for two unrelated classes in both directions. That is no
 * order, so a subclass registered after an unrelated class could stay behind
 * its superclass, and `route_error()`, which takes the first class an error is
 * an instance of, converted it with the superclass's closure (#1665).
 *
 * 1. Call routes throwing each registered class, registered with an unrelated
 *    class between `DomainError` and its subclasses, and assert each status.
 * 2. Register the four classes in every order and assert each class's first match
 *    is itself, restoring the server's registration afterwards.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks four converted HTTP statuses and every registration permutation selects the most specific error class.
 * @evidence contracts/testing.md#independent-expectations JavaScript instanceof inheritance and the authored class/status map independently define the required conversion.
 * @evidence contracts/testing.md#distinguishing-cases Superclass, subclasses and unrelated errors across all registration orders distinguish nontransitive sorting and wrong first matches.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Checks four converted HTTP statuses and every registration permutation selects the most specific error class. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage Superclass, subclasses and unrelated errors across all registration orders distinguish nontransitive sorting and wrong first matches. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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

  const classes = [DomainError, OtherError, NotFoundError, GoneError];
  const statuses = new Map<Function, number>([
    [DomainError, 400],
    [OtherError, 409],
    [NotFoundError, 404],
    [GoneError, 410],
  ]);
  const permutations = (list: typeof classes): Array<typeof classes> =>
    list.length <= 1
      ? [list]
      : list.flatMap((first, i) =>
          permutations([...list.slice(0, i), ...list.slice(i + 1)]).map(
            (rest) => [first, ...rest],
          ),
        );
  try {
    for (const order of permutations(classes)) {
      for (const creator of classes) core.ExceptionManager.erase(creator);
      for (const creator of order)
        core.ExceptionManager.insert(
          creator,
          () => new HttpException("", statuses.get(creator)!),
        );
      for (const creator of classes) {
        const matched = core.ExceptionManager.tuples.find(
          ([registered]) => (new creator() as Error) instanceof registered,
        );
        TestValidator.equals(
          `${order.map((c) => c.name).join(" -> ")}: ${creator.name}`,
          matched?.[0]?.name,
          creator.name,
        );
      }
    }
  } finally {
    for (const creator of classes) core.ExceptionManager.erase(creator);
    for (const creator of classes)
      core.ExceptionManager.insert(
        creator,
        () => new HttpException("", statuses.get(creator)!),
      );
  }
};
