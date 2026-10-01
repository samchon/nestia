import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

/**
 * Verifies decomposed query and header parameters retain optionality.
 *
 * Swagger required flags must describe the same omission accepted by the
 * controller, even when exact optional types contain no undefined union.
 *
 * 1. Generate Swagger for a query and headers with optional and required keys.
 * 2. Assert both optional flags are false and both required controls are true.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual generated /optional/query parameters must contain query optional/required and header x-optional/x-required with exact false/true required flags; missing parameters cannot satisfy undefined-versus-boolean comparisons.
 * @evidence contracts/testing.md#independent-expectations The authored OptionalController explicitly distinguishes optional and required query/header properties under exactOptionalPropertyTypes. Those declarations establish the four expected flags independently of the document.
 * @evidence contracts/testing.md#distinguishing-cases Optional and adjacent required controls run for both query and header locations. The runtime optional case owns actual omission/transport, while this case owns decomposed document flags.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the exact boundary owner after actual generation and consumer compilation. Compiler identity controls fail preparation; runtime mismatches reject the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects native optional metadata, Swagger parameter decomposition and serialized generated output; a TypeScript assignment check cannot establish required flags in OpenAPI.
 * @evidence contracts/e2e.md#shared-execution The same exact producer, generated SDK, Swagger and consumer compilation serve this case and the assignment/property cases. One public All invocation reuses one unlistened app and the campaign installation/cache; this function adds only artifact reads.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The exact boundary uses its own source/output directory and true flag for both compiler requests. Artifact reads are immutable and local; the owning operation attempts app closure and captures raw phases and artifacts even on failure.
 * @evidence contracts/e2e.md#preserved-coverage All four original query/header required flags remain literal comparisons. Only the artifact root changes for the shared exact compilation; original transport cells remain separately owned and their execution is not claimed here.
 */
export const test_swagger_optional_parameters = async (): Promise<void> => {
  const document = JSON.parse(
    await fs.promises.readFile(
      path.resolve(__dirname, "../../../consumer/swagger.json"),
      "utf8",
    ),
  );
  const parameters = document.paths["/optional/query"].get.parameters;
  for (const [name, location, required] of [
    ["optional", "query", false],
    ["required", "query", true],
    ["x-optional", "header", false],
    ["x-required", "header", true],
  ] as const) {
    const parameter = parameters.find(
      (p: { name: string; in: string }) => p.name === name && p.in === location,
    );
    TestValidator.equals(`${location} ${name}`, parameter?.required, required);
  }
};
