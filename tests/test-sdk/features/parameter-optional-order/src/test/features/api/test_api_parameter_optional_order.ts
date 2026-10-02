import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies an optional query parameter before a required body compiles and
 * calls, with and without a value.
 *
 * The SDK marked every optional parameter `?`, so one before the required body
 * failed to compile: "A required parameter cannot follow an optional parameter"
 * (#1728).
 *
 * 1. Call the query-field route with a mode, then with `undefined`.
 * 2. Call the query-object route with a page, then with `undefined`.
 * 3. Call a route whose controller declares the optional query after the body,
 *    which the SDK still places before it.
 * 4. Call the simulator the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Field and object routes return independently authored mode:value and page:value strings; omitted and reordered cases pin undefined-before-body call signatures, and simulation accepts the same argument order.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: Field and object routes return independently authored mode:value and page:value strings; omitted and reordered cases pin undefined-before-body call signatures, and simulation accepts the same argument order.
 * @evidence contracts/testing.md#distinguishing-cases Field and object routes return independently authored mode:value and page:value strings; omitted and reordered cases pin undefined-before-body call signatures, and simulation accepts the same argument order.
 * @evidence contracts/testing.md#execution-ownership The parameter-optional-order installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary Generated parameter order must compile and reach the correct backend argument positions.
 * @evidence contracts/e2e.md#shared-execution This case reuses the parameter-optional-order fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The parameter-optional-order fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_api_parameter_optional_order = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "field",
    await api.functional.order.field(connection, "a", { value: 1 }),
    "a:1",
  );
  TestValidator.equals(
    "field absent",
    await api.functional.order.field(connection, undefined, { value: 2 }),
    "none:2",
  );
  TestValidator.equals(
    "object",
    await api.functional.order.object(connection, { page: 3 }, { value: 4 }),
    "3:4",
  );
  TestValidator.equals(
    "object absent",
    await api.functional.order.object(connection, undefined, { value: 5 }),
    "none:5",
  );
  TestValidator.equals(
    "reordered absent",
    await api.functional.order.reordered(connection, undefined, { value: 6 }),
    "none:6",
  );
  await api.functional.order.field(
    { ...connection, simulate: true },
    undefined,
    { value: 7 },
  );
};
