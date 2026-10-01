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
 * @evidence contracts/testing.md#behavioral-verification Generated optional/ignored query objects must have required:false, while typed and field-named query controls have required:true.
 * @evidence contracts/testing.md#independent-expectations Authored DTO property optionality and ignore directives establish whether a described required key exists. A field-named parameter represents its own required key independently of object decomposition.
 * @evidence contracts/testing.md#distinguishing-cases All-optional versus visible-required versus ignored-only-required DTOs and a field parameter contrast the presence rule. Missing parameters return undefined and fail each expected boolean.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual metadata visibility and undecomposed Swagger requirement composition must connect; handler parameter optionality alone cannot prove described-key requiredness.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
