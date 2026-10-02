import { OpenApiV3 } from "@typia/interface";
import fs from "fs";
import typia from "typia";

export const test_openapi_v3 = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assert<OpenApiV3.IDocument>(swagger);
};
