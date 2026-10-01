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
 * @evidence contracts/testing.md#behavioral-verification Generated optional-before-required field/object/reordered calls must compile and return exact a:1/none:2/3:4/none:5/none:6; an absent-field simulator call must resolve.
 * @evidence contracts/testing.md#independent-expectations OrderController explicitly formats mode/page default none plus body.value, independently establishing the five literals. TypeScript forbids required parameters after question-mark optional parameters, so consumer compilation certifies the signature arrangement.
 * @evidence contracts/testing.md#distinguishing-cases Present/undefined field and object, reversed controller declaration and simulator contrast optional argument positions. Simulator output is not asserted, so that last call proves accepted invocation only.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated signatures, consumer compilation and HTTP parameter/body mapping must connect; a local parameter-sort unit cannot certify these callable exports.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
