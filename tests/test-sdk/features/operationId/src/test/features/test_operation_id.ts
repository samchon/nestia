import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies authored operation IDs override the configured generator.
 *
 * The callback identifies ordinary methods by class and function, while the
 * method's operationId tag must keep its authored value.
 *
 * 1. Read the document generated from the operationId fixture.
 * 2. Compare an ordinary endpoint with the endpoint carrying an explicit tag.
 */
export const test_operation_id = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "configured callback",
    swagger.paths["/performance"].get.operationId,
    "PerformanceController.get",
  );
  TestValidator.equals(
    "authored tag takes precedence",
    swagger.paths["/operationId/custom"].get.operationId,
    "some-custom-operation-id",
  );
};
