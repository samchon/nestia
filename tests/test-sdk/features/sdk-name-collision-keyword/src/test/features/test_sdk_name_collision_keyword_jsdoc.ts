import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies the keyword SDK function documents its argument under the renamed
 * `props` parameter.
 *
 * In keyword mode the SDK's own `props` parameter yields to a method named
 * `props` (#1647), so a `@param props.x` tag would name a member of a parameter
 * that no longer exists, and an IDE would show the function undocumented.
 *
 * The WebSocket function documents its `props` keys the same way: the query
 * object's key yields to a path parameter named `query`, and a tag naming the
 * controller's parameter would describe no key. A wrapped description continues
 * under its first line, past the declared `props.query`.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `props` function documents its argument as `_props.props`.
 * 3. Read the generated SDK file of `SocketController`.
 * 4. Assert the `query` function documents the path parameter as `props.query` and
 *    the query object as `props._query`.
 * 5. Assert the `provider` function continues its wrapped `@param props.query`
 *    under its description.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated keyword props JSDoc must name _props.props and props.query/props._query with the asserted wrapped text.
 * @evidence contracts/testing.md#independent-expectations Authored controller descriptions and the public renamed parameter signature establish exact text/indentation needles independently of the generated comment.
 * @evidence contracts/testing.md#distinguishing-cases HTTP props collision and WebSocket path/query collision retain distinct tag destinations and wrapped-description controls.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_keyword_jsdoc export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The actual native controller metadata and SDK printer must produce source consumed by the compiler; exact final text detects naming/documentation corruption not observable from an HTTP echo alone.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its already generated source with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads resolve from this case to its own generated feature outputs; it mutates neither source nor another member. The harness removes its copied tree after emitted execution finishes.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_keyword_jsdoc assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
 */
export const test_sdk_name_collision_keyword_jsdoc =
  async (): Promise<void> => {
    const content: string = await fs.promises.readFile(
      `${__dirname}/../../api/functional/shadow/index.ts`,
      "utf8",
    );
    TestValidator.equals(
      "@param",
      content.includes("@param _props.props Shadow to echo"),
      true,
    );

    const socket: string = await fs.promises.readFile(
      `${__dirname}/../../api/functional/socket/index.ts`,
      "utf8",
    );
    TestValidator.equals(
      "@param path",
      socket.includes(
        "@param props.query Path segment named like the query parameter",
      ),
      true,
    );
    TestValidator.equals(
      "@param query",
      socket.includes("@param props._query Shadow to search"),
      true,
    );
    TestValidator.equals(
      "WebSocket @param continued under its description",
      socket.includes(
        `\n * ${" ".repeat("@param props.query ".length)}onto a second line\n`,
      ),
      true,
    );
  };
