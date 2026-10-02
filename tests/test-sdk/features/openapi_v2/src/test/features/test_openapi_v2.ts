import { SwaggerV2 } from "@typia/interface";
import fs from "fs";
import typia from "typia";

/**
 * Verifies the generated Swagger document satisfies the Swagger 2.0 document
 * shape.
 *
 * Structural validation covers the complete emitted document alongside the
 * focused body, query and default-server assertions.
 *
 * 1. Execute the authored fixture's generated client or read its generated
 *    document.
 * 2. Assert the independently defined behavior and shape.
 *
 * @evidence contracts/testing.md#behavioral-verification typia.assert<SwaggerV2.IDocument> rejects structurally invalid generated documents.
 * @evidence contracts/testing.md#independent-expectations The SwaggerV2.IDocument interface supplies the declared target-version structure independently from generator output.
 * @evidence contracts/testing.md#distinguishing-cases This covers one rich positive document; the sibling focused cases distinguish body omission, schema retention and decomposed constraints.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The compiled fixture and Swagger generator must produce an artifact accepted by the target-version interface; compile success alone does not check the JSON document.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
 */
export const test_openapi_v2 = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assert<SwaggerV2.IDocument>(swagger);
};
