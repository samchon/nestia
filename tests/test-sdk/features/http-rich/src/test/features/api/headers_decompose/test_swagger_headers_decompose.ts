import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies checks emitted header parameter names x-category, x-memo, x-name,
 * x-values and x-flags.
 *
 * The authored decomposable header DTO names establish the expected OpenAPI
 * parameter names.
 *
 * 1. Execute the authored feature through its prepared generated artifacts.
 * 2. Assert the distinctions described below.
 *
 * @evidence contracts/testing.md#behavioral-verification The freshly generated TypedHeaders parameters retain the exact ordered five authored nonignored header names.
 * @evidence contracts/testing.md#independent-expectations Preserved authored DTOs, literal header arrays and the void controller establish expectations independently of generation. Header parameter order follows the authored declaration and the ignore annotation excludes X-descriptions.
 * @evidence contracts/testing.md#distinguishing-cases The header HTTP case retains valid and invalid numeric-array twins; the document case retains ordered names and omission of the ignored header. Health and dynamic performance retain their original successful transport/shape assertions without claiming malformed endpoint coverage.
 * @evidence contracts/testing.md#execution-ownership The shared installed consumer discovers this matching file/export after public compilation; this case reads fresh product output or calls the actual generated client.
 * @evidence contracts/e2e.md#necessary-boundary The installed producer, application-based generator and generated consumer must agree on authored controller metadata and transport. Direct composer units cannot prove that metadata connection.
 * @evidence contracts/e2e.md#shared-execution One installation, producer, all-generation, consumer and application serve this case and the other rich inputs, without any per-option compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Prefixed stateless routes isolate scenario identities; document reads and request inputs are case-local, generation creates fresh artifacts and the runner closes its application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertions from tests/test-sdk/features/headers-decompose/src/test/features/test_swagger.ts remain with only recorded import, class, route, case and artifact-location identities changed. The shared configuration explicitly retains decompose true and the class/function callback; beautify formatting has direct generator unit coverage.
 */
export const test_swagger_headers_decompose = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../swagger.json",
      "utf8",
    ),
  );
  const headers = content.paths[
    "/http_rich/headers_decompose/headers/{section}"
  ].patch.parameters.filter((p: any) => p.in === "header");
  TestValidator.equals(
    "headers",
    headers.map((p: any) => p.name),
    ["x-category", "x-memo", "x-name", "x-values", "x-flags"],
  );
};
