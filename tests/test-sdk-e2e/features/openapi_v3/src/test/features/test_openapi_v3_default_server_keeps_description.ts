import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies nestia's default server keeps its placeholder description at every
 * version that can carry one.
 *
 * Why: Swagger 2.0 has nowhere to put a server description, so the default
 * server drops it for that one target. The description is the hint that the url
 * is a placeholder, and it is worth keeping wherever it fits, so this is the
 * twin one property away from the 2.0 case: a fix that simply stopped emitting
 * the description would satisfy the 2.0 assertions and silently remove the hint
 * from every other version.
 *
 * 1. Read the generated 3.0 document of a project that configures no servers.
 * 2. Assert the default server url is still described.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated servers must exactly contain the placeholder URL and insert your server url description.
 * @evidence contracts/testing.md#independent-expectations The documented nestia placeholder and3.0 server description support establish the handwritten expected object; the2.0-only omission must not erase content at supported versions.
 * @evidence contracts/testing.md#distinguishing-cases No configured server is the default branch, with2.0 omission as its adjacent version control. Exact array equality rejects extra/default-shape drift but does not test custom servers.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual version-aware Swagger composition must retain representable metadata in the final document; a default URL helper alone cannot prove this branch.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_openapi_v3_default_server_keeps_description =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    TestValidator.equals("servers", swagger.servers, [
      {
        url: "https://github.com/samchon/nestia",
        description: "insert your server url",
      },
    ]);
  };
