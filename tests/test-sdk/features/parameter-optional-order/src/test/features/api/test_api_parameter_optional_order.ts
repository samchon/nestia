import { TestValidator } from "@nestia/e2e";

import api from "../../../api";

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
