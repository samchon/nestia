import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "query",
    {
      name: "query",
      in: "query",
      schema: { $ref: "#/components/schemas/IQuery" },
      required: true,
    },
    content.paths["/query/typed"].get.parameters.find(
      (p: any) => p.in === "query",
    )!,
  );
};
