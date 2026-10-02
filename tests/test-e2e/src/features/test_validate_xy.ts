import { TestValidator } from "@nestia/e2e";

/**
 * Verifies testValidator equality treats the expected left shape as the
 * comparison projection.
 *
 * The left id expectation is a subset of the richer right object and only
 * matching id values satisfy that projection.
 *
 * 1. Exercise the authored scenario and its controls.
 * 2. Assert a richer right object with the same id passes; changing id fails
 *    notEquals while its extra name remains permitted.
 *
 * @evidence contracts/testing.md#behavioral-verification TestValidator equality treats the expected left shape as the comparison projection.
 * @evidence contracts/testing.md#independent-expectations The left id expectation is a subset of the richer right object and only matching id values satisfy that projection.
 * @evidence contracts/testing.md#distinguishing-cases A richer right object with the same id passes; changing id fails notEquals while its extra name remains permitted.
 * @evidence contracts/testing.md#execution-ownership The test-e2e source entry discovers this test-prefixed export; it directly invokes the operation with local fixtures or supported transport injection and performs no product installation or real network session.
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
