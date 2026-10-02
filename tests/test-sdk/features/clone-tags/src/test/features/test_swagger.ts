import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies checks store and update Swagger tags equal bbs, public, write.
 *
 * Those tags are authored on the fixture controller and its route declarations.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 */
export const test_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "tags of store()",
    swagger.paths["/bbs/articles/{section}"].post.tags,
    ["bbs", "public", "write"],
  );
  TestValidator.equals(
    "tags of update()",
    swagger.paths["/bbs/articles/{section}/{id}"].put.tags,
    ["bbs", "public", "write"],
  );
};
