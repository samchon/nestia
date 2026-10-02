import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies an undecomposed query object is required only when the request must
 * send one of its keys.
 *
 * With `decompose: false` the whole DTO is one query parameter, which used to
 * take `required` from the handler parameter alone. A DTO whose properties are
 * all optional is satisfied by an empty query string, so marking it required
 * made Swagger UI and request validators demand a value the endpoint does not
 * need. The rule counts only the keys the document describes, and leaves a
 * field-named parameter, which is one query key of its own, as declared.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the all-optional DTO and a DTO whose only required property is
 *    `@ignore`d are not required.
 * 3. Assert the DTO with a required property and a field-named parameter are
 *    required.
 *
 * @evidence contracts/testing.md#behavioral-verification Optional-only and ignored-required DTOs are optional, while typed required fields and the named field remain required.
 * @evidence contracts/testing.md#independent-expectations The authored controller and DTO are the oracle: Optional-only and ignored-required DTOs are optional, while typed required fields and the named field remain required.
 * @evidence contracts/testing.md#distinguishing-cases Optional-only and ignored-required DTOs are optional, while typed required fields and the named field remain required.
 * @evidence contracts/testing.md#execution-ownership The query-decompose-false installed SDK fixture compiles this matching test-prefixed export and its src/test/index.ts DynamicExecutor invokes it against that fixture backend.
 * @evidence contracts/e2e.md#necessary-boundary CLI-generated Swagger metadata must reflect native route and DTO analysis rather than only the runtime endpoint.
 * @evidence contracts/e2e.md#shared-execution This case reuses the query-decompose-false fixture SDK compilation, document generation and backend with its other tests. The current master runner still prepares separate fixtures independently; whole-suite batching remains an execution limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The query-decompose-false fixture owns generated artifacts and its backend lifetime; each case supplies local inputs to echo or fixed-error endpoints, and the feature index closes its backend after the executor report. Earlier harness failures can bypass that close; this case does not claim cancellation-safe suite cleanup.
 * @evidence contracts/e2e.md#preserved-coverage No assertion was transferred to another layer; the value and failure checks named here remain in this executable case. Other fixture cases own different DTO and decorator options.
 */
export const test_swagger_optional_object = async (): Promise<void> => {
  const content = JSON.parse(
    await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
  );
  const required = (path: string): boolean | undefined =>
    content.paths[path].get.parameters.find((p: any) => p.in === "query")
      ?.required;
  TestValidator.equals("optional", required("/query/optional"), false);
  TestValidator.equals("ignored", required("/query/ignored"), false);
  TestValidator.equals("typed", required("/query/typed"), true);
  TestValidator.equals("field", required("/query/individual"), true);
};
