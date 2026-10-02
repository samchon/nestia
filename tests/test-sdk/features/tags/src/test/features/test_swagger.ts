import { TestValidator } from "@nestia/e2e";
import fs from "fs";

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
