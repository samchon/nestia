import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger through its generated consumer.
 *
 * The authored handler and DTO establish the observable contract.
 *
 * 1. Exercise the retained generated consumer or document scenario.
 * 2. Reject mismatched values, exposed accessors or expected failures.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated PATCH /headers/{section} header parameters must be exactly the ordered five x-category/x-memo/x-name/x-values/x-flags names.
 * @evidence contracts/testing.md#independent-expectations Authored IHeaders declares those five visible properties and marks X-descriptions ignored; their declaration order supplies the handwritten expected list independently of Swagger output.
 * @evidence contracts/testing.md#distinguishing-cases Required/optional/defaulted scalar and numeric/boolean arrays remain visible, while the adjacent ignored string-array header must be absent. Only names/order are inspected here; sibling schema tests own parameter details.
 * @evidence contracts/testing.md#execution-ownership The feature entry discovers and awaits this exported case after actual generation and consumer compilation; mismatches reject its report and zero discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native header metadata and Swagger decomposition must emit the final serialized parameter list; a DTO property enumeration alone cannot establish ignore/decompose composition.
 * @evidence contracts/e2e.md#shared-execution The suite installs fresh packed packages once and compatible configurations share native producer and emitted runtime programs. This case adds no independent install/compiler; distinct CLI/file-pattern owners retain their own connections.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local inputs and isolated feature outputs prevent another feature supplying this result. Generated document reads are immutable, feature backends close in finally and the harness releases only owned copies after children finish.
 * @evidence contracts/e2e.md#preserved-coverage All existing requests, controls, generated-output reads and assertions remain. Sharing package/compiler preparation changes setup ownership, while the distinct accepted/rejected cases and their asserted limits are retained.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const headers = content.paths["/headers/{section}"].patch.parameters.filter(
    (p: any) => p.in === "header",
  );
  TestValidator.equals(
    "headers",
    headers.map((p: any) => p.name),
    ["x-category", "x-memo", "x-name", "x-values", "x-flags"],
  );
};
