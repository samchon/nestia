import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const headers = content.paths["/headers/{section}"].patch.parameters.filter(
    (p: any) => p.in === "header",
  );
  TestValidator.equals(
    "headers",
    headers.map((p: any) => p.name),
    ["x-category", "x-memo", "x-name", "x-values", "x-flags"],
  );
};
