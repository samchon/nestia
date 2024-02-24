import { ISwaggerRoute } from "@nestia/core/lib/structures/ISwaggerRoute";
import { TestValidator } from "@nestia/e2e";
import { ISwagger } from "@nestia/sdk/lib/structures/ISwagger";
import fs from "fs";

export const test_swagger_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: ISwagger = JSON.parse(content);
  const route: ISwaggerRoute =
    swagger.paths["/custom/{key}/{value}/customize"].get;

  TestValidator.equals("swagger.openapi")(swagger.openapi)("3.0.11");
  TestValidator.equals("route.description")(route.description)(
    "This is a custom description",
  );
  TestValidator.equals(`route["x-selector"]`)((route as any)["x-selector"])({
    method: "get",
    path: "/custom/{id}/normal",
  });
};
