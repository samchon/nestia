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
 * @evidence contracts/testing.md#behavioral-verification Generated positional argument JSDoc must name _props and _query/__query with the asserted wrapped text and indented multiline example.
 * @evidence contracts/testing.md#independent-expectations Authored controller descriptions and the public renamed parameter signature establish exact text/indentation needles independently of the generated comment.
 * @evidence contracts/testing.md#distinguishing-cases HTTP props collision and WebSocket path/query collision retain distinct tag destinations and wrapped-description controls plus a comment beginning with @example.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_jsdoc export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The actual native controller metadata and SDK printer must produce source consumed by the compiler; exact final text detects naming/documentation corruption not observable from an HTTP echo alone.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its already generated source with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads resolve from this case to its own generated feature outputs; it mutates neither source nor another member. The harness removes its copied tree after emitted execution finishes.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_jsdoc assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
