import { TestValidator } from "@nestia/e2e";

import api from "../../api";

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
 * @evidence contracts/testing.md#behavioral-verification The original query field/object present and absent, optional-after-body reorder and explicit simulated request all compile and execute; five exact response strings remain.
 * @evidence contracts/testing.md#independent-expectations The authored controller concatenates the literal query value and body value, or substitutes none for the absent query. These five literal responses define expectations independently of generated SDK source.
 * @evidence contracts/testing.md#distinguishing-cases The original query field/object present and absent, optional-after-body reorder and explicit simulated request all compile and execute; five exact response strings remain.
 * @evidence contracts/testing.md#execution-ownership The matching case is discovered by DynamicExecutor in the shared compiled profile consumer; its original type assertions are compiled by the same consumer program.
 * @evidence contracts/e2e.md#necessary-boundary Installed SDK signatures, argument ordering, query encoding, actual transformed handlers and the mock simulator must connect for the original six calls.
 * @evidence contracts/e2e.md#shared-execution The original distinct generation options retain their public profile graph, while installation, producer compilation, consumer compilation and actual listener are shared. No automated E2E generation is added.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Private controller and route identities isolate these stateless handlers. Only the final request explicitly enables simulation; preceding requests observe actual handlers on the shared listener.
 * @evidence contracts/e2e.md#preserved-coverage Every original call, literal assertion and compile-time type expression remains unchanged apart from names, imports and accessors. Original wrappers own no additional behavioral assertions.
 */
export const test_clone_parameter_optional_order = async (
  connection: api.IConnection,
): Promise<void> => {
  TestValidator.equals(
    "field",
    await api.functional.http_rich.options.parameter_order.order.field(
      connection,
      "a",
      { value: 1 },
    ),
    "a:1",
  );
  TestValidator.equals(
    "field absent",
    await api.functional.http_rich.options.parameter_order.order.field(
      connection,
      undefined,
      { value: 2 },
    ),
    "none:2",
  );
  TestValidator.equals(
    "object",
    await api.functional.http_rich.options.parameter_order.order.object(
      connection,
      { page: 3 },
      { value: 4 },
    ),
    "3:4",
  );
  TestValidator.equals(
    "object absent",
    await api.functional.http_rich.options.parameter_order.order.object(
      connection,
      undefined,
      { value: 5 },
    ),
    "none:5",
  );
  TestValidator.equals(
    "reordered absent",
    await api.functional.http_rich.options.parameter_order.order.reordered(
      connection,
      undefined,
      { value: 6 },
    ),
    "none:6",
  );
  await api.functional.http_rich.options.parameter_order.order.field(
    { ...connection, simulate: true },
    undefined,
    { value: 7 },
  );
};
