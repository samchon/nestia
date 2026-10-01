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
 * @evidence contracts/testing.md#behavioral-verification All keyword props shadow routes must echo submitted fields and output must assign exact x-value/x-shadow connection headers.
 * @evidence contracts/testing.md#independent-expectations The authored controller returns its inputs, none for omitted optional input and the explicitly submitted ordered lists; header decorators prescribe echo in both assigned keys.
 * @evidence contracts/testing.md#distinguishing-cases Method/parameter/import/global/local collisions, encrypted body, present/omitted optional query and mutable response headers retain different name-binding paths.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_keyword_http export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native metadata, generated parameter bindings and actual HTTP handlers must connect; isolated identifier allocation cannot establish request values or assigned connection headers.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its feature HTTP backend with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each call uses explicit local payloads; the output-header control allocates a fresh headers object where applicable. The entry closes its backend and the harness removes only its own copied outputs.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_keyword_http assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
