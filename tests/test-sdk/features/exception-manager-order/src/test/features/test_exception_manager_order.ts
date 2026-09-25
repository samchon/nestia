import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { HttpException } from "@nestjs/common";

import {
  DomainError,
  GoneError,
  NotFoundError,
  OtherError,
} from "../../DomainErrors";
import api from "../../api";

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
