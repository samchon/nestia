import { TestValidator } from "@nestia/e2e";
import { OpenApi } from "@samchon/openapi";
import fs from "fs";

export const test_swagger_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: OpenApi.IDocument = JSON.parse(content);
  const route: OpenApi.IOperation =
    swagger.paths!["/custom/{key}/{value}/customize"].get!;

  TestValidator.equals("swagger.openapi", swagger.openapi, "3.1.11");
  TestValidator.equals(
    "route.description",
    route.description,
    "This is a custom description",
  );
  TestValidator.equals(`route["x-selector"]`, (route as any)["x-selector"], {
    method: "get",
    path: "/custom/{id}/normal",
  });
};
