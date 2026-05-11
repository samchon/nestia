import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const queries: any[] = content.paths["/query/typed"].get.parameters.filter(
    (p: any) => p.in === "query",
  );

  TestValidator.equals(
    "queries",
    queries.map((q) => q.name),
    ["limit", "enforce", "values", "atomic"],
  );
  TestValidator.equals(
    "not required",
    queries.find((q) => q.name === "limit")?.required,
    false,
  );
  TestValidator.equals(
    "required",
    queries.find((q) => q.name === "enforce")?.required,
    true,
  );
};
