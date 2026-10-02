import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { IShadow } from "@api/lib/structures/IShadow";

/**
 * Verifies keyword-mode SDK functions of routes whose parameter or method names
 * collide with the SDK's own identifiers compile and send every argument.
 *
 * In keyword mode a parameter's name is a public `props` key, so it is never
 * renamed; the SDK's own `props` and `connection` parameters yield instead, to
 * a method named `props` or `connection` (#1647). An optional query object was
 * also read as a bare identifier instead of a `props` member.
 *
 * 1. Call every route of `ShadowController` with its arguments keyed by the
 *    controller's parameter names.
 * 2. Assert each response echoes the arguments sent, and that the headers the
 *    `output` route assigns reach the connection.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that keyword shadow routes echo props, honor empty optional props and assign headers.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal props and controller fallback/header contracts, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns colliding function/connection/fetcher/local/global keys, encryption and header output.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted colliding function/connection/fetcher/local/global keys, encryption and header output distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_name_collision_keyword_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const shadow: IShadow = { value: "shadow" };
  const shadows = api.functional.shadow;
  TestValidator.equals(
    "query",
    await shadows.query(connection, { query: shadow }),
    shadow,
  );
  TestValidator.equals(
    "body",
    await shadows.body(connection, { body: shadow }),
    shadow,
  );
  TestValidator.equals(
    "param",
    await shadows.param(connection, { param: "value" }),
    "value",
  );
  TestValidator.equals(
    "connect",
    await shadows.connect(connection, { connection: shadow }),
    shadow,
  );
  TestValidator.equals(
    "connection",
    await shadows.connection(connection, { query: shadow }),
    shadow,
  );
  TestValidator.equals(
    "props",
    await shadows.props(connection, { props: shadow }),
    shadow,
  );
  TestValidator.equals(
    "optional",
    await shadows.optional(connection, { query: shadow }),
    shadow,
  );
  TestValidator.equals(
    "optional omitted",
    await shadows.optional(connection, {}),
    { value: "none" },
  );
  TestValidator.equals(
    "imports",
    await shadows.imports(connection, {
      typia: "a",
      PlainFetcher: "b",
      NestiaSimulator: "c",
    }),
    ["a", "b", "c"],
  );
  TestValidator.equals(
    "encrypted",
    await shadows.encrypted(connection, { EncryptedFetcher: shadow }),
    shadow,
  );
  TestValidator.equals(
    "locals",
    await shadows.locals(connection, {
      key: "k",
      value: "v",
      location: "l",
      variables: "a",
      elem: "e",
    }),
    ["k", "v", "l", "a", "e"],
  );
  TestValidator.equals(
    "members",
    await shadows.members(connection, {
      path: "p",
      random: "r",
      METADATA: "m",
      assert: "s",
    }),
    ["p", "r", "m", "s"],
  );
  TestValidator.equals(
    "globals",
    await shadows.globals(connection, {
      encodeURIComponent: "g/1",
      Object: "o",
      String: "s",
      Array: "a",
      URLSearchParams: "u",
      undefined: "x",
    }),
    ["g/1", "o", "s", "a", "u", "x"],
  );

  const assigned: api.IConnection = { ...connection, headers: {} };
  TestValidator.equals(
    "output",
    await shadows.output(assigned, { output: "echo" }),
    { value: "echo", headers: { "x-shadow": "echo" } },
  );
  TestValidator.equals("output headers", assigned.headers, {
    "x-value": "echo",
    "x-shadow": "echo",
  });
};
