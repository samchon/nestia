import { TestValidator } from "@nestia/e2e";

import api from "../../api";
import { IShadow } from "../../api/structures/IShadow";

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
