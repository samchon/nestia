import { TestValidator } from "@nestia/e2e";
import path from "path";

/**
 * Verifies exception insertion puts concrete descendants before ancestors.
 *
 * An unrelated registration between ancestors and descendants exposed the
 * previous non-ordering comparator. The permutation rule is portable; actual
 * converted HTTP statuses remain in the SDK exception-manager boundary.
 *
 * 1. Define an unrelated class beside a three-level error inheritance chain.
 * 2. Insert the four classes in every permutation and check each first match.
 * 3. Restore the exact original registry in finally.
 *
 * @evidence contracts/testing.md#behavioral-verification In all 24 registration orders the built ExceptionManager first matching constructor must be each concrete error's own class, rejecting an ancestor selected ahead of a descendant.
 * @evidence contracts/testing.md#independent-expectations The authored class inheritance establishes specificity independently of current tuple order. A concrete constructor always outranks an ancestor for its own instance.
 * @evidence contracts/testing.md#distinguishing-cases Three inheritance levels and an unrelated class run through every permutation. This preserves the former SDK in-process controls; four actual HTTP conversion/status checks retain their separate E2E owner.
 * @evidence contracts/testing.md#execution-ownership This matching exported function runs synchronously in the shared serial unit process and loads the built internal registry by absolute path. It starts no server/compiler and restores the exact prior tuples, including unrelated registrations, in finally.
 */
export const test_core_exception_manager_specificity = (): void => {
  type Constructor = new () => Error;
  type Tuple = [Constructor, (error: Error) => unknown];
  const { ExceptionManager } = require(
    path.resolve(
      process.cwd(),
      "../../packages/core/lib/utils/ExceptionManager",
    ),
  ) as {
    ExceptionManager: {
      tuples: Tuple[];
      insert: (creator: Constructor, closure: (error: Error) => never) => void;
      erase: (creator: Constructor) => boolean;
    };
  };
  class DomainError extends Error {}
  class OtherError extends Error {}
  class NotFoundError extends DomainError {}
  class GoneError extends NotFoundError {}
  const classes: Constructor[] = [
    DomainError,
    OtherError,
    NotFoundError,
    GoneError,
  ];
  const permutations = (list: Constructor[]): Constructor[][] =>
    list.length <= 1
      ? [list]
      : list.flatMap((first, index) =>
          permutations([...list.slice(0, index), ...list.slice(index + 1)]).map(
            (rest) => [first, ...rest],
          ),
        );
  const original = ExceptionManager.tuples.slice();
  try {
    for (const order of permutations(classes)) {
      for (const creator of classes) ExceptionManager.erase(creator);
      for (const creator of order)
        ExceptionManager.insert(creator, () => {
          throw new Error("This specificity test does not invoke converters.");
        });
      for (const creator of classes) {
        const matched = ExceptionManager.tuples.find(
          ([registered]) => new creator() instanceof registered,
        );
        TestValidator.predicate(
          `${order.map((item) => item.name).join(" -> ")}: ${creator.name}`,
          matched?.[0] === creator,
        );
      }
    }
  } finally {
    ExceptionManager.tuples.splice(
      0,
      ExceptionManager.tuples.length,
      ...original,
    );
  }
};
