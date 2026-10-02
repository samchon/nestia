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
 * @evidence contracts/testing.md#behavioral-verification The emitted default server must split into github.com, /samchon/nestia and https rather than blocking Swagger 2.0 generation.
 * @evidence contracts/testing.md#independent-expectations The documented placeholder URL determines its host/path/scheme independently of the downgrader output.
 * @evidence contracts/testing.md#distinguishing-cases The no-configured-server 2.0 case complements the 3.0 case that retains the placeholder description.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The generated 2.0 artifact proves the default server and document converter connect without an unrepresentable server description.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
