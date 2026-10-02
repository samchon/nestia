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
 *
 * @evidence contracts/testing.md#behavioral-verification The generated Swagger document must contain PerformanceController.get for the ordinary endpoint and some-custom-operation-id for the tagged endpoint.
 * @evidence contracts/testing.md#independent-expectations The fixture config callback joins class and function names; OperationIdController independently authors the explicit tag.
 * @evidence contracts/testing.md#distinguishing-cases An ordinary endpoint and a tagged endpoint distinguish callback application from tag precedence.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The generated document connects compiled controller JSDoc metadata to the configured generator callback; direct callback execution would not verify that connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
