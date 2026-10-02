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
 */
export const test_sdk_name_collision_keyword_module_scope = async (
  connection: api.IConnection,
): Promise<void> => {
  const scope = api.functional.scope;
  const id: string = "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a";
  TestValidator.equals("tags", await scope.tags(connection, { id }), id);
  TestValidator.equals("typia", await scope.typia(connection), "typia");
  TestValidator.equals(
    "PlainFetcher",
    await scope.fetcher.PlainFetcher(connection),
    "PlainFetcher",
  );
  TestValidator.equals("exports", await scope.exports(connection), "exports");
  TestValidator.equals(
    "String",
    await scope.string.String(connection, { value: "v/1", q: "q" }),
    ["v/1", "q"],
  );
};
