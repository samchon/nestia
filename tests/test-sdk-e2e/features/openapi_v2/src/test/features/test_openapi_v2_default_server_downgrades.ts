import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies nestia's own default server survives the Swagger 2.0 downgrade.
 *
 * Why: Swagger 2.0 splits a server url into `host`, `basePath` and `schemes`
 * and has nowhere to put a server description, and the downgrader refuses to
 * discard one rather than silently losing document content the user wrote.
 * Refusing is right for a description the user wrote; the placeholder nestia
 * supplies when a project configures no `swagger.servers` is nestia's own, so
 * it must not be the thing that makes a documented output version impossible to
 * generate.
 *
 * 1. Read the generated 2.0 document of a project that configures no servers.
 * 2. Assert the default url survived, split across `host`, `basePath` and
 *    `schemes`.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated2.0 document must expose host github.com, basePath /samchon/nestia and schemes[https].
 * @evidence contracts/testing.md#independent-expectations Nestia documented default placeholder URL and Swagger2 server decomposition independently establish the three handwritten components. This does not treat authored user descriptions as disposable.
 * @evidence contracts/testing.md#distinguishing-cases No configured server exercises default-placeholder downgrade; the3.0 sibling requires the same placeholder description to remain when representable.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual full Swagger downgrade must accept and split the default server; local URL parsing alone cannot prove generation completes with its placeholder metadata.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_openapi_v2_default_server_downgrades =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    TestValidator.equals("host", swagger.host, "github.com");
    TestValidator.equals("basePath", swagger.basePath, "/samchon/nestia");
    TestValidator.equals("schemes", swagger.schemes, ["https"]);
  };
