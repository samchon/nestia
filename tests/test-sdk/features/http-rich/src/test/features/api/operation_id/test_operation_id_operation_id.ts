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
 * @evidence contracts/testing.md#behavioral-verification Configured class/function operationId and the explicit authored operationId tag must both appear in the freshly generated Swagger document; the tag takes precedence.
 * @evidence contracts/testing.md#independent-expectations The public operationId callback yields the authored class and method identity; the literal some-custom-operation-id comes from the original method tag and overrides that callback.
 * @evidence contracts/testing.md#distinguishing-cases An ordinary method selects the configured callback; an explicitly tagged method selects its original literal instead.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after public compilation; this case reads fresh product output or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, application-based generator and generated consumer must agree on authored controller metadata and transport. Direct composer units cannot prove that metadata connection.
 * @evidence contracts/e2e.md#shared-execution One installation, producer, all-generation, consumer and application serve this case and the other rich inputs, without any per-option compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Prefixed stateless routes isolate scenario identities; document reads and request inputs are case-local, generation creates fresh artifacts and the runner closes its application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertions from tests/test-sdk/features/operationId/src/test/features/test_operation_id.ts remain with only recorded import, class, route, case and artifact-location identities changed. The shared configuration explicitly retains decompose true and the class/function callback; beautify formatting has direct generator unit coverage.
 */
export const test_operation_id_operation_id = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../swagger.json",
      "utf8",
    ),
  );
  TestValidator.equals(
    "configured callback",
    swagger.paths["/http_rich/operation_id/performance"].get.operationId,
    "OperationIdPerformanceController.get",
  );
  TestValidator.equals(
    "authored tag takes precedence",
    swagger.paths["/http_rich/operation_id/operationId/custom"].get.operationId,
    "some-custom-operation-id",
  );
};
