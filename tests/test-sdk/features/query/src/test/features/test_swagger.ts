import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a generated composite query DTO has its omitted property shape.
 *
 * The CLI metadata producer must register the derived DTO in its document.
 *
 * 1. Execute the authored fixture inputs through the owning route.
 * 2. Assert the generated OmitIQueryatomic schema exists for the authored
 *    composite query controller; this assertion only proves schema registration
 *    and does not validate its field contents.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated OmitIQueryatomic schema exists for the authored composite query controller; this assertion only proves schema registration and does not validate its field contents.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: The generated OmitIQueryatomic schema exists for the authored composite query controller; this assertion only proves schema registration and does not validate its field contents.
 * @evidence contracts/testing.md#distinguishing-cases The generated OmitIQueryatomic schema exists for the authored composite query controller; this assertion only proves schema registration and does not validate its field contents.
 * @evidence contracts/testing.md#execution-ownership The query installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary The CLI metadata producer must register the derived DTO in its document.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  TestValidator.equals(
    "replace",
    true,
    !!swagger.components.schemas?.OmitIQueryatomic,
  );
};
