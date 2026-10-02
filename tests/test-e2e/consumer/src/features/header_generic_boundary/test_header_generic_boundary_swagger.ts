import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Verifies the original decomposed headers retain their ordered Swagger names.
 *
 * The mixed-case header echo scenario includes additional properties and cannot
 * establish this original five-property decomposition contract.
 *
 * 1. Read the current sandbox's freshly generated Swagger document.
 * 2. Compare the PATCH header parameters to the five authored visible names.
 * 3. Require the adjacent ignored string-array property to remain absent.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual generated PATCH parameters must contain exactly five ordered header names and exclude X-descriptions; an added, omitted or reordered parameter fails.
 * @evidence contracts/testing.md#independent-expectations Original IHeaders declares x-category, x-memo, x-name, x-values and x-flags in that order and marks X-descriptions ignored. The expected literals are independent of generated schemas.
 * @evidence contracts/testing.md#distinguishing-cases Required category, optional memo, defaulted name and numeric/boolean arrays remain visible; the adjacent ignored string array does not. This case asserts names/order, not unexamined schema details.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this sole matching export after its single compilation and reads only the current sandbox document.
 * @evidence contracts/e2e.md#necessary-boundary Installed native metadata and Swagger decomposition must connect to serialized OpenAPI parameters; DTO enumeration alone cannot establish that composition.
 * @evidence contracts/e2e.md#shared-execution This reads the existing All generation's document and creates no compiler, installation, generator or backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The boundary route prefix isolates the copied original controller. The sandbox-relative document belongs to this run and is not mutated; the common entry owns cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original headers-decompose/test_swagger's exact five-name ordered equality remains here, including ignored-member exclusion. Runtime header parsing remains complementary; actual execution is pending.
 */
export const test_header_generic_boundary_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.readFile(
      path.resolve(__dirname, "../../../../../swagger.json"),
      "utf8",
    ),
  );
  const headers = swagger.paths[
    "/header_generic_boundary/decompose/headers/{section}"
  ].patch.parameters.filter(
    (parameter: { in: string }) => parameter.in === "header",
  );
  const names = headers.map((parameter: { name: string }) => parameter.name);
  assert.deepEqual(names, [
    "x-category",
    "x-memo",
    "x-name",
    "x-values",
    "x-flags",
  ]);
  assert.equal(names.includes("X-descriptions"), false);
};
