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
 * @evidence contracts/testing.md#behavioral-verification The assertions require that fresh SDK JSDoc documents _props.props/props.query/props._query and continuation indentation.
 * @evidence contracts/testing.md#independent-expectations Expectations come from public keyword signatures and authored controller prose, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns renamed props parameter and displaced query/path keys.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision-keyword fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary The public generated source/document is fresh generator output; a backend request cannot establish its required spelling.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision-keyword runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision-keyword fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted renamed props parameter and displaced query/path keys distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
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
