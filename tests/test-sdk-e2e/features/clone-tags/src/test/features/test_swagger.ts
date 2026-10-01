import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies class and method Swagger tags survive generation.
 *
 * The two methods deliberately use different method-level metadata sources.
 *
 * 1. Read the generated document and the authored inputs needed by this scenario.
 * 2. Compare every retained field with its independently specified value.
 *
 * @evidence contracts/testing.md#behavioral-verification Both generated POST and PUT operation tag arrays must exactly equal bbs/public/write, including order; omission, wrong merging and unrelated output fail.
 * @evidence contracts/testing.md#independent-expectations The handwritten controller declares class ApiTags bbs, POST JSDoc public/write and PUT ApiTags public/write. Those independent declarations establish the literal expected arrays.
 * @evidence contracts/testing.md#distinguishing-cases POST combines class and JSDoc metadata while PUT combines class and decorator metadata. Clone-tags retains the cloned DTO pipeline; tags retains ordinary output. This assertion does not inspect every operation metadata field.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers and awaits this matching exported test_swagger function after actual SDK/Swagger generation; an assertion or output read rejection fails its report.
 * @evidence contracts/e2e.md#necessary-boundary This connects authored Nest decorators/JSDoc, native metadata, Swagger generation and serialized output. Direct metadata unit calls cannot prove both sources survive the assembled generator pipeline.
 * @evidence contracts/e2e.md#shared-execution The document shares its feature generation and runtime process with sibling cases; compatible cohorts share CLI loading and runtime compilation. Per-configuration file reflection remains a preparation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This reads only its own immutable authored inputs and generated document via __dirname. The harness keeps feature outputs and ports separate; the feature entry finally closes its backend even when discovery or output assertions fail.
 * @evidence contracts/e2e.md#preserved-coverage Both exact arrays and both metadata sources remain executable for cloned and ordinary features. Other Swagger cases own schema, customization and document-info assertions.
 */
export const test_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "tags of store()",
    swagger.paths["/bbs/articles/{section}"].post.tags,
    ["bbs", "public", "write"],
  );
  TestValidator.equals(
    "tags of update()",
    swagger.paths["/bbs/articles/{section}/{id}"].put.tags,
    ["bbs", "public", "write"],
  );
};
