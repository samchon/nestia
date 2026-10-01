import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger through its generated consumer.
 *
 * Optional and required properties contrast requirement propagation under
 * decompose:true. Exact names reject dropped/extra/order changes; schema
 * details are owned by the parameter-schema population.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated typed query parameters must have exact ordered limit/enforce/values/atomic names, with limit required:false and enforce required:true.
 * @evidence contracts/testing.md#independent-expectations Authored IQuery declaration order and optional limit versus required enforce establish handwritten expected names/flags independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases Optional and required properties contrast requirement propagation under decompose:true. Exact names reject dropped/extra/order changes; schema details are owned by the parameter-schema population.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native property metadata and Swagger decomposition must emit final parameter names/flags; runtime query echo cannot certify document optionality.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
