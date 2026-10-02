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
 * @evidence contracts/testing.md#behavioral-verification The assertions require that tags/typia/PlainFetcher/exports/String exports remain callable and echo inputs.
 * @evidence contracts/testing.md#independent-expectations Expectations come from literal controller returns and authored UUID/path/query inputs, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns import names, CommonJS exports and global names with slash-bearing path values.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary Generated clients connect their compiled arguments, transport encoding and decoded responses to real controller behavior.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted import names, CommonJS exports and global names with slash-bearing path values distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
