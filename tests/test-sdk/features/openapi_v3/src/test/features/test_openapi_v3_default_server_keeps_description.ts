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
 * @evidence contracts/testing.md#behavioral-verification The generated servers array must retain the placeholder URL and its explanatory description.
 * @evidence contracts/testing.md#independent-expectations The default-server contract supplies the literal placeholder and description independently of conversion output.
 * @evidence contracts/testing.md#distinguishing-cases The 3.0 positive complements the 2.0 omission case; a global description deletion would fail this assertion.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The target-version document generator must preserve representable default-server content in the emitted JSON artifact.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
