import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IShadow } from "@api/lib/structures/IShadow";

/**
 * Verifies SDK functions whose parameters collide with the SDK's own
 * identifiers compile and send every argument.
 *
 * Parameters were written with the controller's names verbatim next to the
 * function's `connection`, its namespace, the fetcher import, and the locals of
 * `path()`, so a parameter named `query` in a method named `query`, or one
 * named `connection`, made the SDK fail to compile (#1647). The SDK now renames
 * a parameter only where the name is one it cannot change, and escapes its own
 * identifiers otherwise; either way each argument must still reach the server.
 *
 * 1. Call every route of `ShadowController` through the SDK.
 * 2. Assert each response echoes the arguments sent, and that the headers the
 *    `output` route assigns reach the connection.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that positional shadow routes echo arguments, honor optional omission and assign response headers.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal caller inputs and controller fallback/header contracts, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns colliding function/connection/fetcher/local/global names, encrypted calls and omitted optional arguments.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted colliding function/connection/fetcher/local/global names, encrypted calls and omitted optional arguments distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_name_collision_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const shadow: IShadow = { value: "shadow" };
  const shadows = api.functional.shadow;
  TestValidator.equals(
    "query",
    await shadows.query(connection, shadow),
    shadow,
  );
  TestValidator.equals("body", await shadows.body(connection, shadow), shadow);
  TestValidator.equals(
    "param",
    await shadows.param(connection, "value"),
    "value",
  );
  TestValidator.equals(
    "connect",
    await shadows.connect(connection, shadow),
    shadow,
  );
  TestValidator.equals(
    "connection",
    await shadows.connection(connection, shadow),
    shadow,
  );
  TestValidator.equals(
    "props",
    await shadows.props(connection, shadow),
    shadow,
  );
  TestValidator.equals(
    "optional",
    await shadows.optional(connection, shadow),
    shadow,
  );
  TestValidator.equals("optional omitted", await shadows.optional(connection), {
    value: "none",
  });
  TestValidator.equals(
    "imports",
    await shadows.imports(connection, "a", "b", "c"),
    ["a", "b", "c"],
  );
  TestValidator.equals(
    "encrypted",
    await shadows.encrypted(connection, shadow),
    shadow,
  );
  TestValidator.equals(
    "locals",
    await shadows.locals(connection, "k", "v", "l", "a", "e"),
    ["k", "v", "l", "a", "e"],
  );
  TestValidator.equals(
    "members",
    await shadows.members(connection, "p", "r", "m", "s"),
    ["p", "r", "m", "s"],
  );
  TestValidator.equals(
    "globals",
    await shadows.globals(connection, "g/1", "o", "s", "a", "u", "x"),
    ["g/1", "o", "s", "a", "u", "x"],
  );

  const assigned: api.IConnection = { ...connection, headers: {} };
  TestValidator.equals("output", await shadows.output(assigned, "echo"), {
    value: "echo",
    headers: { "x-shadow": "echo" },
  });
  TestValidator.equals("output headers", assigned.headers, {
    "x-value": "echo",
    "x-shadow": "echo",
  });
};
