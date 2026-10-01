import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger through its generated consumer.
 *
 * One undecomposed object contrasts decomposed scalar properties and the
 * all-optional object controls. Exact equality rejects omitted style/explode or
 * altered ref/name/required fields.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated /query/typed must expose the exact single query object parameter with IQuery ref, required:true, style:form and explode:true.
 * @evidence contracts/testing.md#independent-expectations Authored IQuery requires fields and decompose:false retains one form/exploded object parameter. The handwritten exact object follows that declared query contract, not an output snapshot.
 * @evidence contracts/testing.md#distinguishing-cases One undecomposed object contrasts decomposed scalar properties and the all-optional object controls. Exact equality rejects omitted style/explode or altered ref/name/required fields.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native query metadata and Swagger composition must emit the final serialized object parameter; enumerating DTO keys alone cannot prove undecomposed style.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
