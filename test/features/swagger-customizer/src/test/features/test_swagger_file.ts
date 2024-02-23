import { TestValidator } from "@nestia/e2e";
import { ISwagger } from "@nestia/sdk/lib/structures/ISwagger";
import fs from "fs";

export const test_swagger_file = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: ISwagger = JSON.parse(content);
  TestValidator.equals("swagger.openapi")(swagger.openapi)("3.0.11");
  TestValidator.equals("route.description")(
    swagger.paths["/swagger/{key}/customize"].get.description,
  )("This is a custom description");
  TestValidator.equals("route.description")(
    swagger.paths["/swagger/{id}/normal"].get.description,
  )("That is the normal description");
};
