import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "extension",
    {
      "x-deprecated": true,
      "x-visibility": "public",
    },
    swagger.paths["/performance"]!.get,
  );
}
