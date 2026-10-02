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
