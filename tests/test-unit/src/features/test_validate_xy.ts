import { TestValidator } from "@nestia/e2e";

/**
 * Verifies `TestValidator.equals()` compares only the keys of its first value
 * and `notEquals()` reports a difference in them.
 *
 * 1. Compare `{ id }` with a value that has an extra member and assert equality.
 * 2. Compare it with a different `id` and assert `notEquals` passes.
 *
 * @evidence contracts/testing.md#behavioral-verification It calls `equals` and `notEquals` on a value and a larger one, and asserts that only the keys of the first value decide, as the documentation states.
 * @evidence contracts/testing.md#independent-expectations The first-value-keys rule is the documented contract of the comparator, and the literals state each verdict.
 * @evidence contracts/testing.md#distinguishing-cases An equal first key with an extra member is the case that must pass; a different first key is the adjacent case that must differ.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process that `DynamicExecutor` discovers by the `test` prefix under `src/features`, and calls the `@nestia/e2e` operation directly in-process; it installs no consumer, builds no native artifact, and starts no server.
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
