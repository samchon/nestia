import { TestValidator } from "../../../../packages/e2e/lib";

/**
 * Verifies testValidator equality treats the expected left shape as the
 * comparison projection.
 *
 * The left id expectation is a subset of the richer right object and only
 * matching id values satisfy that projection.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert a richer right object with the same id passes; changing id satisfies
 *    notEquals while its extra name remains permitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls equals and notEquals using a left id projection against richer right objects.
 * @evidence contracts/testing.md#independent-expectations Authored matching and different id literals establish equality independently of the additional name field.
 * @evidence contracts/testing.md#distinguishing-cases The same id with an extra name passes equals; a different id with an extra name passes notEquals.
 * @evidence contracts/testing.md#execution-ownership The test-e2e unit entry discovers this direct built-package utility case; it installs no consumer and starts no native compiler, product host or worker.
 */
export const test_validate_xy = (): void => {
  interface IExplicit {
    id: string;
    name: string;
  }
  TestValidator.equals("xy", { id: "1" }, {
    id: "1",
    name: "John Doe",
  } satisfies IExplicit as IExplicit);
  TestValidator.notEquals("xy", { id: "1" }, {
    id: "2",
    name: "Kevin",
  } satisfies IExplicit as IExplicit);
};
