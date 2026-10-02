import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the SDK function documents a renamed parameter under its new name.
 *
 * A positional parameter named like its method is renamed with a `_` prefix
 * (#1647); a `@param` tag still naming the old identifier would describe no
 * parameter, and an IDE would show the function undocumented.
 *
 * The WebSocket function documents its parameters the same way. In a route
 * named `query`, the path parameter `query` yields to the route as `_query`,
 * and the query object to both as `__query`; a tag naming the controller's
 * parameter would describe no parameter. It also continues a tag's text where
 * TypeScript reads it back as written: a wrapped description under its first
 * line, and an `@example`'s code, which starts on the next line, with its own
 * indentation. A route without a description opens with its first tag.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its renamed `_props` parameter, its
 *    wrapped description aligned under the declared name's description.
 * 3. Read the generated SDK file of `SocketController`.
 * 4. Assert the `query` function documents the path parameter as `_query` and the
 *    query object as `__query`.
 * 5. Assert the `provider` function's comment opens with its `@example`, keeps the
 *    code's indentation, and continues its wrapped `@param` under its
 *    description.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that fresh SDK JSDoc documents _props/_query/__query and preserves continuations/examples.
 * @evidence contracts/testing.md#independent-expectations Expectations come from public generated parameter names and authored controller documentation, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns HTTP/socket renamed parameters, multiline prose, tag-first example and indentation.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary The public generated source/document is fresh generator output; a backend request cannot establish its required spelling.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted HTTP/socket renamed parameters, multiline prose, tag-first example and indentation distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_name_collision_jsdoc = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/shadow/index.ts`,
    "utf8",
  );
  TestValidator.equals(
    "@param",
    content.includes("@param _props Shadow to echo"),
    true,
  );
  TestValidator.equals(
    "@param continued under its description",
    content.includes(
      `\n * ${" ".repeat("@param _props ".length)}a second line`,
    ),
    true,
  );

  const socket: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/socket/index.ts`,
    "utf8",
  );
  TestValidator.equals(
    "@param path",
    socket.includes(
      "@param _query Path segment named like the query parameter",
    ),
    true,
  );
  TestValidator.equals(
    "@param query",
    socket.includes("@param __query Shadow to search"),
    true,
  );
  TestValidator.equals(
    "WebSocket @param continued under its description",
    socket.includes(
      `\n * ${" ".repeat("@param query ".length)}onto a second line\n`,
    ),
    true,
  );
  TestValidator.equals(
    "WebSocket @example",
    socket.includes(
      [
        "/**",
        " * @example",
        " *   const { connector, driver } = await provider(connection, query, null);",
        " *   if (driver !== null) {",
        " *     await connector.close();",
        " *   }",
      ].join("\n"),
    ),
    true,
  );
};
