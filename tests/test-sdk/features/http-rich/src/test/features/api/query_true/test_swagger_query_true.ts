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
 * @evidence contracts/testing.md#behavioral-verification Fresh Swagger query parameters retain ordered limit/enforce/values/atomic names and exact optional-limit versus required-enforce flags.
 * @evidence contracts/testing.md#independent-expectations The authored interface declaration and decomposition contract define literal parameter order and requiredness independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases Optional numeric limit contrasts required boolean enforce while array and nullable fields retain their distinct ordered entries.
 * @evidence contracts/testing.md#execution-ownership The matching installed consumer case reads the freshly generated shared document after public native metadata and reflection generation.
 * @evidence contracts/e2e.md#necessary-boundary The connection between transformed parameter metadata and reflected Swagger decomposition must retain field order and requiredness; authored composer inputs alone do not establish it.
 * @evidence contracts/e2e.md#shared-execution This document case shares one installation, producer, generation, consumer and application with all query HTTP cases and existing rich scenarios.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique query identities prevent collisions and this case only reads fresh output; the shared runner owns its lifetime.
 * @evidence contracts/e2e.md#preserved-coverage Every original ordered name and true/false requiredness assertion remains after route and document-location changes; decomposition remains explicitly true.
 */
export const test_swagger_query_true = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(
      `${__dirname}/../../../../../swagger.json`,
      "utf8",
    ),
  );
  const queries: any[] = content.paths[
    "/http_rich/query_true/typed"
  ].get.parameters.filter((p: any) => p.in === "query");

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
