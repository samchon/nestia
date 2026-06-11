import { TestValidator } from "@nestia/e2e";
import fs from "fs";

export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals("paths", Object.keys(swagger.paths ?? {}).sort(), [
    "/swagger-visible-endpoint",
  ]);
}
