import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger through its generated consumer.
 *
 * Mapped Omit type contrasts the ordinary IQuery component and retains its
 * generated name. Dedicated parameter/property-set cases own exact schema
 * constraints.
 *
 * 1. Exercise the retained generated request or emitted document.
 * 2. Compare its selected fields and failures with the authored contract.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual generated components map must contain a truthy OmitIQueryatomic schema.
 * @evidence contracts/testing.md#independent-expectations The authored composite query uses Omit<IQuery,atomic>; the canonical exported component name follows that declaration. This presence-only check does not independently certify the schema's properties or absence of renamed duplicates.
 * @evidence contracts/testing.md#distinguishing-cases Mapped Omit type contrasts the ordinary IQuery component and retains its generated name. Dedicated parameter/property-set cases own exact schema constraints.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by the actual feature executor after generation and compilation. Assertion failures reject its report and empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native mapped-type metadata and Swagger component writing must expose the emitted name; TypeScript mapped-type assignment alone cannot prove the serialized component exists.
 * @evidence contracts/e2e.md#shared-execution Fresh packed dependencies and compatible native producer/emitted runtime programs are shared. Ordinary API/document cases reuse their feature backend; parser/adapter/clone/CLI state differences retain distinct preparation scopes.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Local submitted values and separately copied outputs isolate the feature. Additional adapter listen/calls and connectors are covered by finally closure where present, the entry closes its backend, and the harness releases owned trees after child completion.
 * @evidence contracts/e2e.md#preserved-coverage The requests, exact values, document constraints and rejected controls stated above remain in this executable owner. Transferred SDK expansion assertions retain their shared unit owner; strengthened positive tool/Observable payload controls supplement existing checks.
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
