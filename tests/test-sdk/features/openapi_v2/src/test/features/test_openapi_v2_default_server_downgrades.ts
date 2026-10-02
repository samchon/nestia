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
