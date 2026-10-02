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
