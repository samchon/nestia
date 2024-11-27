import { TestValidator } from "@nestia/e2e";

export async function test_swagger(): Promise<void> {
  const swagger = await import(__dirname + "/../../../../swagger.json");
  TestValidator.equals("extension")({
    "x-deprecated": true,
    "x-visibility": "public",
  })(swagger.paths["/performance"].get);
}
