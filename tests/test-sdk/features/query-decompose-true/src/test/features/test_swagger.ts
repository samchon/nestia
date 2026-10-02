import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies decomposed query documentation lists individual fields with distinct
 * requiredness.
 *
 * The CLI decomposition policy must compose native property metadata into
 * request parameters.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the authored ordered names are limit, enforce, values and atomic;
 *    limit is optional while enforce is required.
 *
 * @evidence contracts/testing.md#behavioral-verification The authored ordered names are limit, enforce, values and atomic; limit is optional while enforce is required.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The authored ordered names are limit, enforce, values and atomic; limit is optional while enforce is required.
 * @evidence contracts/testing.md#distinguishing-cases The authored ordered names are limit, enforce, values and atomic; limit is optional while enforce is required.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-true installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The CLI decomposition policy must compose native property metadata into request parameters.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-true fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-true fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const queries: any[] = content.paths["/query/typed"].get.parameters.filter(
    (p: any) => p.in === "query",
  );

  TestValidator.equals(
    "queries",
    queries.map((q) => q.name),
    ["limit", "enforce", "values", "atomic"],
  );
  TestValidator.equals(
    "not required",
    queries.find((q) => q.name === "limit")?.required,
    false,
  );
  TestValidator.equals(
    "required",
    queries.find((q) => q.name === "enforce")?.required,
    true,
  );
};
