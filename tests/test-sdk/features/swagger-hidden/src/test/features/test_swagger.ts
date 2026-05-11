import fs from "fs";
import { TestValidator } from "@nestia/e2e";

export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"));
  TestValidator.equals("paths", swagger.paths ?? {}, {});
}
