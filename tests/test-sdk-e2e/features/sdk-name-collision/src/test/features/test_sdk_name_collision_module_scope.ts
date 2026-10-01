import { TestValidator } from "@nestia/e2e";

import api from "@api";

/**
 * Verifies SDK functions named like an identifier of their file's module scope
 * compile and keep their names.
 *
 * A route's function and namespace are declared in the module scope of its SDK
 * file, next to the file's imports and the globals its bodies call. A method
 * named like one of them conflicted with the import or shadowed the global for
 * the whole file, so the SDK failed to compile (#1647): `tags` beside the
 * `tags.Format` its path parameter is typed with, `typia` and `PlainFetcher`
 * beside the helpers the bodies call, `exports`, which TypeScript reserves in a
 * CommonJS module, and `String`, which `path()` calls. Such a route is declared
 * under a local name and exported as itself.
 *
 * 1. Call every route of `ScopeController` through the SDK by its own name.
 * 2. Assert each response echoes the arguments sent.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated positional argument functions keep callable tags/typia/PlainFetcher/exports/String exports and exact authored echoes.
 * @evidence contracts/testing.md#independent-expectations The explicit UUID, v/1 and q inputs and literal typia/PlainFetcher/exports handler returns provide independent expectations.
 * @evidence contracts/testing.md#distinguishing-cases Module imports, CommonJS reserved exports and global String shadowing differ from local parameter collisions; slash-bearing input checks encoding while preserving the exported name.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_module_scope export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Native metadata, generated parameter bindings and actual HTTP handlers must connect; isolated identifier allocation cannot establish request values or assigned connection headers.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its feature HTTP backend with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each call uses explicit local payloads; the output-header control allocates a fresh headers object where applicable. The entry closes its backend and the harness removes only its own copied outputs.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_module_scope assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
 */
export const test_sdk_name_collision_module_scope = async (
  connection: api.IConnection,
): Promise<void> => {
  const scope = api.functional.scope;
  const id: string = "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a";
  TestValidator.equals("tags", await scope.tags(connection, id), id);
  TestValidator.equals("typia", await scope.typia(connection), "typia");
  TestValidator.equals(
    "PlainFetcher",
    await scope.fetcher.PlainFetcher(connection),
    "PlainFetcher",
  );
  TestValidator.equals("exports", await scope.exports(connection), "exports");
  TestValidator.equals(
    "String",
    await scope.string.String(connection, "v/1", "q"),
    ["v/1", "q"],
  );
};
