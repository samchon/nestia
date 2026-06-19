import { TestValidator } from "@nestia/e2e";

export const test_swagger = async (): Promise<void> => {
  const swagger = await import("../../../swagger.json");
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
