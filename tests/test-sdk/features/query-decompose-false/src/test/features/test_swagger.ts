import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed typed query is one required form/explode object
 * parameter.
 *
 * CLI route and DTO analysis must preserve object-query wire encoding in
 * OpenAPI metadata.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored expected query parameter is named query with the IQuery
 *    reference, required true, form style and explode true.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored expected query parameter is named query with the IQuery reference, required true, form style and explode true.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored expected query parameter is named query with the IQuery reference, required true, form style and explode true.
 * @evidence contracts/testing.md#distinguishing-cases The authored expected query parameter is named query with the IQuery reference, required true, form style and explode true.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-false installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary CLI route and DTO analysis must preserve object-query wire encoding in OpenAPI metadata.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-false fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-false fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "query",
    {
      name: "query",
      in: "query",
      schema: { $ref: "#/components/schemas/IQuery" },
      required: true,
      style: "form",
      explode: true,
    },
    content.paths["/query/typed"].get.parameters.find(
      (p: any) => p.in === "query",
    )!,
  );
};
